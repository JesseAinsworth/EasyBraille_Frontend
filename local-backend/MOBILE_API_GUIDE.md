# EasyBraille API Documentation for Mobile Development

## 📱 Android/Kotlin Integration Guide

### Base Configuration

```kotlin
// Constants.kt
object ApiConstants {
    const val BASE_URL = "http://localhost:5000/api/"
    const val MOBILE_BASE_URL = "http://localhost:5000/api/mobile/"
    
    // Endpoints
    const val AUTH_REGISTER = "auth/register"
    const val AUTH_LOGIN = "auth/login"
    const val AUTH_REFRESH = "auth/refresh"
    const val AUTH_LOGOUT = "auth/logout"
    const val BRAILLE_IMAGE = "braille-image"
    const val TRANSLATIONS_TEXT = "translations/text"
    const val TRANSLATIONS_IMAGE = "translations/image"
    const val KEYBOARD_ACTIONS = "keyboard-actions"
    const val MOBILE_DASHBOARD = "mobile/dashboard"
    const val MOBILE_SYNC = "mobile/sync-progress"
}
```

### HTTP Client Setup (Retrofit)

```kotlin
// ApiService.kt
import retrofit2.Response
import retrofit2.http.*
import okhttp3.MultipartBody
import okhttp3.RequestBody

interface ApiService {
    
    // Authentication
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<TokenResponse>
    
    @POST("auth/logout")
    suspend fun logout(@Header("Authorization") token: String, @Body request: LogoutRequest): Response<BasicResponse>
    
    // Braille Image Detection
    @Multipart
    @POST("braille-image")
    suspend fun detectBraille(
        @Header("Authorization") token: String,
        @Part image: MultipartBody.Part,
        @Part("deviceInfo") deviceInfo: RequestBody
    ): Response<BrailleDetectionResponse>
    
    // Text Translation
    @POST("translations/text")
    suspend fun translateText(
        @Header("Authorization") token: String,
        @Body request: TextTranslationRequest
    ): Response<TranslationResponse>
    
    // Keyboard Actions
    @POST("keyboard-actions")
    suspend fun recordKeyboardAction(
        @Header("Authorization") token: String,
        @Body request: KeyboardActionRequest
    ): Response<BasicResponse>
    
    // Mobile Specific
    @GET("mobile/dashboard")
    suspend fun getMobileDashboard(@Header("Authorization") token: String): Response<MobileDashboardResponse>
    
    @POST("mobile/sync-progress")
    suspend fun syncProgress(
        @Header("Authorization") token: String,
        @Body request: SyncProgressRequest
    ): Response<SyncProgressResponse>
    
    @GET("mobile/offline-data")
    suspend fun getOfflineData(@Header("Authorization") token: String): Response<OfflineDataResponse>
}
```

### Data Models

```kotlin
// Data Models for API Requests and Responses

// Authentication
data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val language: String = "es",
    val theme: String = "light"
)

data class LoginRequest(
    val email: String,
    val password: String,
    val platform: String = "android",
    val deviceToken: String? = null
)

data class AuthResponse(
    val message: String,
    val user: User,
    val tokens: TokenData
)

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val avatar: String?,
    val language: String,
    val theme: String,
    val learningLevel: String,
    val totalTranslations: Int,
    val totalKeyboardPractice: Int,
    val streakDays: Int,
    val isEmailVerified: Boolean,
    val lastLoginAt: String?
)

data class TokenData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: String
)

// Braille Detection
data class BrailleDetectionResponse(
    val message: String,
    val texto: String,
    val confidence: Double?,
    val processingTime: Long,
    val imageInfo: ImageInfo,
    val railwayBackendUsed: Boolean,
    val timestamp: String
)

data class ImageInfo(
    val filename: String,
    val size: Long,
    val type: String
)

// Text Translation
data class TextTranslationRequest(
    val inputText: String,
    val translationType: String, // "text-to-braille" or "braille-to-text"
    val language: String = "es",
    val isPublic: Boolean = false,
    val deviceInfo: DeviceInfo
)

data class DeviceInfo(
    val platform: String = "android",
    val appVersion: String,
    val deviceModel: String
)

data class TranslationResponse(
    val message: String,
    val translation: Translation
)

data class Translation(
    val id: String,
    val inputText: String?,
    val outputText: String,
    val translationType: String,
    val language: String,
    val processingTime: Long,
    val createdAt: String,
    val confidence: Double?
)

// Keyboard Actions
data class KeyboardActionRequest(
    val sessionId: String,
    val actionType: String, // "keypress", "session_start", "session_end", "practice_complete"
    val keyPressed: String?,
    val expectedKey: String?,
    val isCorrect: Boolean?,
    val responseTime: Long?,
    val practiceMode: String?,
    val difficulty: String?,
    val sessionStats: SessionStats?,
    val deviceInfo: DeviceInfo,
    val language: String = "es"
)

data class SessionStats(
    val totalKeys: Int,
    val correctKeys: Int,
    val accuracy: Double,
    val wpm: Double,
    val duration: Long, // seconds
    val errorsCount: Int
)

// Mobile Dashboard
data class MobileDashboardResponse(
    val user: DashboardUser,
    val stats: DashboardStats,
    val recentTranslations: List<RecentTranslation>,
    val keyboardProgress: KeyboardProgress
)

data class DashboardUser(
    val name: String,
    val avatar: String?,
    val learningLevel: String,
    val streakDays: Int
)

data class DashboardStats(
    val totalTranslations: Int,
    val totalKeyboardPractice: Int,
    val todayTranslations: Int,
    val todayKeyboardSessions: Int
)

data class RecentTranslation(
    val outputText: String,
    val translationType: String,
    val createdAt: String,
    val confidence: Double?
)

data class KeyboardProgress(
    val totalSessions: Int,
    val avgAccuracy: Double,
    val avgWpm: Double,
    val bestAccuracy: Double,
    val bestWpm: Double
)

// Generic Response
data class BasicResponse(
    val message: String
)
```

### Authentication Manager

```kotlin
// AuthManager.kt
import android.content.Context
import android.content.SharedPreferences

class AuthManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
    
    companion object {
        private const val ACCESS_TOKEN_KEY = "access_token"
        private const val REFRESH_TOKEN_KEY = "refresh_token"
        private const val USER_DATA_KEY = "user_data"
    }
    
    fun saveTokens(accessToken: String, refreshToken: String) {
        prefs.edit()
            .putString(ACCESS_TOKEN_KEY, accessToken)
            .putString(REFRESH_TOKEN_KEY, refreshToken)
            .apply()
    }
    
    fun getAccessToken(): String? {
        return prefs.getString(ACCESS_TOKEN_KEY, null)
    }
    
    fun getRefreshToken(): String? {
        return prefs.getString(REFRESH_TOKEN_KEY, null)
    }
    
    fun getAuthHeader(): String? {
        return getAccessToken()?.let { "Bearer $it" }
    }
    
    fun saveUser(user: User) {
        val gson = Gson()
        prefs.edit()
            .putString(USER_DATA_KEY, gson.toJson(user))
            .apply()
    }
    
    fun getUser(): User? {
        val userJson = prefs.getString(USER_DATA_KEY, null)
        return if (userJson != null) {
            val gson = Gson()
            gson.fromJson(userJson, User::class.java)
        } else null
    }
    
    fun isLoggedIn(): Boolean {
        return getAccessToken() != null
    }
    
    fun logout() {
        prefs.edit().clear().apply()
    }
}
```

### API Repository

```kotlin
// ApiRepository.kt
import android.content.Context
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class ApiRepository(private val context: Context) {
    private val apiService = RetrofitClient.apiService
    private val authManager = AuthManager(context)
    
    // Authentication
    suspend fun register(name: String, email: String, password: String): Result<AuthResponse> {
        return try {
            val request = RegisterRequest(name, email, password)
            val response = apiService.register(request)
            
            if (response.isSuccessful) {
                response.body()?.let { authResponse ->
                    authManager.saveTokens(
                        authResponse.tokens.accessToken,
                        authResponse.tokens.refreshToken
                    )
                    authManager.saveUser(authResponse.user)
                    Result.success(authResponse)
                } ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("Registration failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun login(email: String, password: String, deviceToken: String? = null): Result<AuthResponse> {
        return try {
            val request = LoginRequest(email, password, "android", deviceToken)
            val response = apiService.login(request)
            
            if (response.isSuccessful) {
                response.body()?.let { authResponse ->
                    authManager.saveTokens(
                        authResponse.tokens.accessToken,
                        authResponse.tokens.refreshToken
                    )
                    authManager.saveUser(authResponse.user)
                    Result.success(authResponse)
                } ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("Login failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Braille Detection
    suspend fun detectBraille(imageFile: File, deviceModel: String, appVersion: String): Result<BrailleDetectionResponse> {
        return try {
            val authHeader = authManager.getAuthHeader() ?: return Result.failure(Exception("Not authenticated"))
            
            val requestFile = imageFile.asRequestBody("image/*".toMediaTypeOrNull())
            val imagePart = MultipartBody.Part.createFormData("image", imageFile.name, requestFile)
            
            val deviceInfo = DeviceInfo("android", appVersion, deviceModel)
            val deviceInfoJson = Gson().toJson(deviceInfo)
            val deviceInfoBody = deviceInfoJson.toRequestBody("application/json".toMediaTypeOrNull())
            
            val response = apiService.detectBraille(authHeader, imagePart, deviceInfoBody)
            
            if (response.isSuccessful) {
                response.body()?.let { Result.success(it) }
                    ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("Braille detection failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Text Translation
    suspend fun translateText(
        inputText: String,
        translationType: String,
        appVersion: String,
        deviceModel: String
    ): Result<TranslationResponse> {
        return try {
            val authHeader = authManager.getAuthHeader() ?: return Result.failure(Exception("Not authenticated"))
            
            val request = TextTranslationRequest(
                inputText = inputText,
                translationType = translationType,
                deviceInfo = DeviceInfo("android", appVersion, deviceModel)
            )
            
            val response = apiService.translateText(authHeader, request)
            
            if (response.isSuccessful) {
                response.body()?.let { Result.success(it) }
                    ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("Text translation failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Mobile Dashboard
    suspend fun getMobileDashboard(): Result<MobileDashboardResponse> {
        return try {
            val authHeader = authManager.getAuthHeader() ?: return Result.failure(Exception("Not authenticated"))
            
            val response = apiService.getMobileDashboard(authHeader)
            
            if (response.isSuccessful) {
                response.body()?.let { Result.success(it) }
                    ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("Failed to get dashboard: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Keyboard Action Recording
    suspend fun recordKeyboardAction(action: KeyboardActionRequest): Result<BasicResponse> {
        return try {
            val authHeader = authManager.getAuthHeader() ?: return Result.failure(Exception("Not authenticated"))
            
            val response = apiService.recordKeyboardAction(authHeader, action)
            
            if (response.isSuccessful) {
                response.body()?.let { Result.success(it) }
                    ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("Failed to record keyboard action: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### Usage Examples

```kotlin
// MainActivity.kt
class MainActivity : AppCompatActivity() {
    private lateinit var apiRepository: ApiRepository
    private lateinit var authManager: AuthManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        apiRepository = ApiRepository(this)
        authManager = AuthManager(this)
        
        // Check if user is logged in
        if (authManager.isLoggedIn()) {
            loadDashboard()
        } else {
            showLoginScreen()
        }
    }
    
    private fun loadDashboard() {
        lifecycleScope.launch {
            val result = apiRepository.getMobileDashboard()
            result.onSuccess { dashboard ->
                // Update UI with dashboard data
                updateDashboardUI(dashboard)
            }.onFailure { error ->
                // Handle error
                showError(error.message)
            }
        }
    }
    
    private fun translateBrailleImage(imageFile: File) {
        lifecycleScope.launch {
            val result = apiRepository.detectBraille(
                imageFile, 
                Build.MODEL, 
                BuildConfig.VERSION_NAME
            )
            
            result.onSuccess { response ->
                // Show translation result
                showTranslationResult(response.texto)
            }.onFailure { error ->
                showError(error.message)
            }
        }
    }
}
```

## 🔐 Authentication Flow

### 1. Registration/Login
```kotlin
// Login/Register Activity
private fun performLogin(email: String, password: String) {
    lifecycleScope.launch {
        val result = apiRepository.login(email, password, getDeviceToken())
        result.onSuccess { authResponse ->
            // Navigate to main app
            startActivity(Intent(this@LoginActivity, MainActivity::class.java))
            finish()
        }.onFailure { error ->
            showLoginError(error.message)
        }
    }
}
```

### 2. Token Management
```kotlin
// Automatic token refresh using Interceptor
class AuthInterceptor(private val authManager: AuthManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)
        
        if (response.code == 401) {
            // Token expired, try to refresh
            val refreshToken = authManager.getRefreshToken()
            if (refreshToken != null) {
                // Implement token refresh logic
                refreshTokenSync(refreshToken)
            }
        }
        
        return response
    }
}
```

## 📊 Error Handling

```kotlin
// ApiException.kt
sealed class ApiException(message: String) : Exception(message) {
    class NetworkError : ApiException("Network connection error")
    class Unauthorized : ApiException("Authentication required")
    class ValidationError(val errors: List<FieldError>) : ApiException("Validation failed")
    class ServerError : ApiException("Server error occurred")
    class ServiceUnavailable : ApiException("Service temporarily unavailable")
}

data class FieldError(
    val field: String,
    val message: String
)
```

## 🔄 Offline Support

```kotlin
// OfflineManager.kt
class OfflineManager(private val context: Context) {
    private val database = EasyBrailleDatabase.getInstance(context)
    
    suspend fun syncWhenOnline() {
        if (isNetworkAvailable()) {
            val offlineData = database.offlineDataDao().getAllPending()
            apiRepository.syncProgress(offlineData)
            database.offlineDataDao().clearSynced()
        }
    }
    
    suspend fun saveForOfflineSync(data: OfflineData) {
        database.offlineDataDao().insert(data)
    }
}
```

This comprehensive guide provides everything needed to integrate the EasyBraille backend with Android/Kotlin applications, including authentication, API calls, error handling, and offline support.