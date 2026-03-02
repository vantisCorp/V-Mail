mod config;
mod models;
mod crypto;
mod auth;
mod handlers;
mod services;
mod utils;
mod middleware;

use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use config::Config;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "vantis_mail_backend=debug,actix_web=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    info!("Configuration loaded successfully");

    // Initialize database connection pool
    let db_pool = services::database::create_pool(&config).await?;
    info!("Database connection pool created");

    // Run migrations
    services::database::run_migrations(&db_pool).await?;
    info!("Database migrations completed");

    // Create JWT service
    let jwt_service = auth::jwt::JwtService::new(
        config.jwt.secret.clone(),
        (config.jwt.expiration / 3600) as i64,
    );

    // Start HTTP server
    let bind_address = format!("{}:{}", config.server.host, config.server.port);
    info!("Starting server on {}", bind_address);

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(db_pool.clone()))
            .app_data(web::Data::new(jwt_service.clone()))
            // Health check endpoint
            .route("/health", web::get().to(handlers::health::health_check))
            // Auth routes
            .service(
                web::scope("/api/auth")
                    .route("/register", web::post().to(handlers::auth::register))
                    .route("/login", web::post().to(handlers::auth::login))
                    .route("/logout", web::post().to(handlers::auth::logout))
            )
            // Email routes (protected)
            .service(
                web::scope("/api/emails")
                    .wrap(auth::middleware::AuthMiddleware::new(jwt_service.clone()))
                    .route("", web::get().to(handlers::emails::list_emails))
                    .route("", web::post().to(handlers::emails::create_email))
                    .route("/{id}", web::get().to(handlers::emails::get_email))
                    .route("/{id}", web::patch().to(handlers::emails::update_email))
                    .route("/{id}", web::delete().to(handlers::emails::delete_email))
            )
            // Alias routes (protected)
            .service(
                web::scope("/api/aliases")
                    .wrap(auth::middleware::AuthMiddleware::new(jwt_service.clone()))
                    .route("", web::get().to(handlers::aliases::list_aliases))
                    .route("", web::post().to(handlers::aliases::create_alias))
                    .route("/{id}", web::delete().to(handlers::aliases::delete_alias))
            )
            // Folder routes (protected)
            .service(
                web::scope("/api/folders")
                    .wrap(auth::middleware::AuthMiddleware::new(jwt_service.clone()))
                    .route("", web::get().to(handlers::folders::list_folders))
                    .route("", web::post().to(handlers::folders::create_folder))
            )
    })
    .bind(&bind_address)?
    .run()
    .await?;

    Ok(())
}