use anyhow::Result;
use mime_guess::Mime;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

/// File storage service for managing attachments
pub struct StorageService {
    base_path: PathBuf,
    max_file_size: usize,
    allowed_mime_types: Vec<String>,
}

impl StorageService {
    /// Create a new storage service
    pub fn new(base_path: String, max_file_size: usize, allowed_mime_types: Vec<String>) -> Self {
        let base_path = PathBuf::from(base_path);
        
        // Create base directory if it doesn't exist
        fs::create_dir_all(&base_path).expect("Failed to create storage directory");

        Self {
            base_path,
            max_file_size,
            allowed_mime_types,
        }
    }

    /// Store a file
    pub async fn store_file(&self, file_data: FileData) -> Result<StoredFileInfo> {
        // Validate file size
        if file_data.content.len() > self.max_file_size {
            return Err(anyhow::anyhow!(
                "File size exceeds maximum allowed size of {} bytes",
                self.max_file_size
            ));
        }

        // Validate MIME type
        if !self.allowed_mime_types.is_empty() {
            if !self.allowed_mime_types.contains(&file_data.mime_type) {
                return Err(anyhow::anyhow!(
                    "MIME type '{}' is not allowed",
                    file_data.mime_type
                ));
            }
        }

        // Generate unique filename
        let file_id = Uuid::new_v4();
        let extension = self.get_extension_from_mime(&file_data.mime_type);
        let filename = format!("{}{}", file_id, extension);
        let file_path = self.base_path.join(&filename);

        // Write file to disk
        fs::write(&file_path, &file_data.content)?;

        // Get file size
        let file_size = fs::metadata(&file_path)?.len() as usize;

        Ok(StoredFileInfo {
            id: file_id,
            filename: file_data.original_filename,
            file_path: filename,
            mime_type: file_data.mime_type,
            size: file_size,
        })
    }

    /// Retrieve a file
    pub async fn get_file(&self, file_id: Uuid) -> Result<FileContent> {
        // Find file by ID
        let entries = fs::read_dir(&self.base_path)?;
        
        for entry in entries {
            let entry = entry?;
            let path = entry.path();
            
            if let Some(name) = path.file_name() {
                if let Some(name_str) = name.to_str() {
                    if name_str.starts_with(&file_id.to_string()) {
                        let content = fs::read(&path)?;
                        let mime_type = self.guess_mime_type(&path);
                        
                        return Ok(FileContent {
                            content,
                            mime_type,
                            filename: name_str.to_string(),
                        });
                    }
                }
            }
        }

        Err(anyhow::anyhow!("File not found: {}", file_id))
    }

    /// Delete a file
    pub async fn delete_file(&self, file_id: Uuid) -> Result<()> {
        let entries = fs::read_dir(&self.base_path)?;
        
        for entry in entries {
            let entry = entry?;
            let path = entry.path();
            
            if let Some(name) = path.file_name() {
                if let Some(name_str) = name.to_str() {
                    if name_str.starts_with(&file_id.to_string()) {
                        fs::remove_file(&path)?;
                        return Ok(());
                    }
                }
            }
        }

        Err(anyhow::anyhow!("File not found: {}", file_id))
    }

    /// Get file extension from MIME type
    fn get_extension_from_mime(&self, mime_type: &str) -> String {
        match mime_type {
            "image/jpeg" => ".jpg".to_string(),
            "image/png" => ".png".to_string(),
            "image/gif" => ".gif".to_string(),
            "image/webp" => ".webp".to_string(),
            "application/pdf" => ".pdf".to_string(),
            "text/plain" => ".txt".to_string(),
            "text/html" => ".html".to_string(),
            "application/zip" => ".zip".to_string(),
            "application/x-rar-compressed" => ".rar".to_string(),
            "application/x-7z-compressed" => ".7z".to_string(),
            "application/msword" => ".doc".to_string(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx".to_string(),
            "application/vnd.ms-excel" => ".xls".to_string(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => ".xlsx".to_string(),
            "application/vnd.ms-powerpoint" => ".ppt".to_string(),
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" => ".pptx".to_string(),
            "video/mp4" => ".mp4".to_string(),
            "video/quicktime" => ".mov".to_string(),
            "video/x-msvideo" => ".avi".to_string(),
            "audio/mpeg" => ".mp3".to_string(),
            "audio/wav" => ".wav".to_string(),
            _ => ".bin".to_string(),
        }
    }

    /// Guess MIME type from file path
    fn guess_mime_type(&self, path: &Path) -> String {
        mime_guess::from_path(path)
            .first_or_octet_stream()
            .to_string()
    }

    /// Sanitize filename
    pub fn sanitize_filename(filename: &str) -> String {
        filename
            .chars()
            .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            })
            .collect()
    }

    /// Validate file content for security
    pub fn validate_file_content(content: &[u8], mime_type: &str) -> Result<()> {
        // Check for potential malicious content in images
        if mime_type.starts_with("image/") {
            // Check for embedded scripts in images (basic check)
            let content_str = String::from_utf8_lossy(content);
            if content_str.contains("<script") || content_str.contains("javascript:") {
                return Err(anyhow::anyhow!("Potentially malicious content detected in image"));
            }
        }

        // Check for executable files
        if mime_type == "application/x-executable" || mime_type == "application/x-msdownload" {
            return Err(anyhow::anyhow!("Executable files are not allowed"));
        }

        Ok(())
    }
}

/// Data for storing a file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileData {
    pub original_filename: String,
    pub content: Vec<u8>,
    pub mime_type: String,
}

/// Information about a stored file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredFileInfo {
    pub id: Uuid,
    pub filename: String,
    pub file_path: String,
    pub mime_type: String,
    pub size: usize,
}

/// Content of a retrieved file
#[derive(Debug, Clone)]
pub struct FileContent {
    pub content: Vec<u8>,
    pub mime_type: String,
    pub filename: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(
            StorageService::sanitize_filename("test file.txt"),
            "test_file.txt"
        );
        assert_eq!(
            StorageService::sanitize_filename("test@#$%file.txt"),
            "test_____file.txt"
        );
    }

    #[test]
    fn test_get_extension_from_mime() {
        let service = StorageService::new("/tmp/test".to_string(), 1024 * 1024, vec![]);
        assert_eq!(service.get_extension_from_mime("image/jpeg"), ".jpg");
        assert_eq!(service.get_extension_from_mime("application/pdf"), ".pdf");
        assert_eq!(service.get_extension_from_mime("unknown/type"), ".bin");
    }

    #[test]
    fn test_validate_file_content() {
        // Valid image
        let valid_image = b"fake_image_data";
        assert!(StorageService::validate_file_content(valid_image, "image/jpeg").is_ok());

        // Malicious image with script
        let malicious_image = b"<script>alert('xss')</script>";
        assert!(StorageService::validate_file_content(malicious_image, "image/jpeg").is_err());

        // Executable file
        let executable = b"fake_executable";
        assert!(StorageService::validate_file_content(executable, "application/x-executable").is_err());
    }
}
