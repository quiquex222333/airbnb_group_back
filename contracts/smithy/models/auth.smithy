$version: "2"

namespace airbnb.auth

use smithy.api#http
use smithy.api#httpError
use smithy.api#required
use smithy.api#pattern
use smithy.api#length
@title("Airbnb Auth Service")
service AuthService {
    version: "2026-04-26",
    operations: [Register, Login, ConfirmSignUp, Refresh, Logout]
}

/// Permite refrescar el token de acceso usando un refresh token.
@http(method: "POST", uri: "/v1/auth/refresh", code: 200)
operation Refresh {
    input: RefreshInput,
    output: LoginOutput,
    errors: [ValidationError, UnauthorizedError, InternalServerError]
}

/// Cierra la sesión del usuario.
@http(method: "POST", uri: "/v1/auth/logout", code: 200)
operation Logout {
    input: LogoutInput,
    output: LogoutOutput,
    errors: [InternalServerError]
}

/// Permite registrar un nuevo usuario en el sistema.
@http(method: "POST", uri: "/v1/auth/register", code: 201)
operation Register {
    input: RegisterInput,
    output: RegisterOutput,
    errors: [ValidationError, ConflictError, InternalServerError]
}

/// Autentica a un usuario y devuelve los tokens de acceso.
@http(method: "POST", uri: "/v1/auth/login", code: 200)
operation Login {
    input: LoginInput,
    output: LoginOutput,
    errors: [ValidationError, UnauthorizedError, InternalServerError]
}

/// Confirma el registro de un usuario mediante un código enviado por email.
@http(method: "POST", uri: "/v1/auth/confirm", code: 200)
operation ConfirmSignUp {
    input: ConfirmSignUpInput,
    output: ConfirmSignUpOutput,
    errors: [ValidationError, NotFoundError, InternalServerError]
}

// --- Estructuras ---

structure RegisterInput {
    @required
    @length(min: 2, max: 100)
    name: String,

    @required
    @pattern("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    email: String,

    @required
    @pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$")
    password: String,

    @required
    role: RegistrationRole
}

enum RegistrationRole {
    GUEST = "guest"
    HOST = "host"
}

structure RegisterOutput {
    @required
    userId: String,
    
    @required
    email: String
}

structure LoginInput {
    @required
    @pattern("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    email: String,

    @required
    password: String
}

structure LoginOutput {
    @required
    accessToken: String,

    @required
    refreshToken: String,

    @required
    expiresIn: Integer,

    @required
    user: UserSummary
}

structure UserSummary {
    @required
    id: String,
    @required
    email: String,
    @required
    name: String,
    @required
    role: String
}

structure ConfirmSignUpInput {
    @required
    @pattern("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    email: String,

    @required
    @length(min: 6, max: 6)
    code: String
}

structure ConfirmSignUpOutput {
    @required
    message: String
}

structure RefreshInput {
    @required
    refreshToken: String
}

structure LogoutInput {
    @required
    accessToken: String
}

structure LogoutOutput {
    @required
    message: String
}

// --- Errores ---

@error("client")
@httpError(400)
structure ValidationError {
    @required
    message: String
}

@error("client")
@httpError(401)
structure UnauthorizedError {
    @required
    message: String
}

@error("client")
@httpError(404)
structure NotFoundError {
    @required
    message: String
}

@error("client")
@httpError(409)
structure ConflictError {
    @required
    message: String
}

@error("server")
@httpError(500)
structure InternalServerError {
    @required
    message: String
}
