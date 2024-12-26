(function() {
    // Get DOM elements
    const videoContainer = document.getElementById("video-container");
    const uploadButton = document.getElementById("upload-button");
    const fileInfoElement = document.getElementById("file-info");
  
    // Increased file size limit to 500MB
    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
    const RECOMMENDED_SIZE = 100 * 1024 * 1024; // 100MB recommended
  
    // Utility function to format file size
    function formatFileSize(bytes) {
      if (bytes < 1024) return `${bytes} bytes`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  
    // Validate video file
    function validateVideoFile(file) {
      const allowedTypes = [
        'video/mp4', 
        'video/webm', 
        'video/ogg'
      ];
  
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Unsupported video format. Please use MP4, WebM, or Ogg.");
      }
  
      // Check file size
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error(`Video file is too large. Maximum size is ${formatFileSize(MAX_VIDEO_SIZE)}.`);
      }
  
      // Warn if file is larger than recommended
      if (file.size > RECOMMENDED_SIZE) {
        fileInfoElement.textContent = `Large file (${formatFileSize(file.size)}). Performance may be affected.`;
        fileInfoElement.style.display = 'block';
      } else {
        fileInfoElement.style.display = 'none';
      }
    }
  
    // Setup video playback
    function setupVideo(videoSrc) {
      return new Promise((resolve, reject) => {
        videoContainer.src = videoSrc;
        
        videoContainer.onloadedmetadata = () => {
          videoContainer.play()
            .then(() => {
              // Hide file info after successful setup
              fileInfoElement.style.display = 'none';
              resolve();
            })
            .catch(reject);
        };
        
        videoContainer.onerror = (error) => {
          console.error("Video error:", error);
          reject(new Error("Could not load video. Check file integrity."));
        };
      });
    }
  
    // Upload button event listener
    uploadButton.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "video/mp4,video/webm,video/ogg";
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
  
        try {
          // Validate file
          validateVideoFile(file);
  
          // Read file
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              await setupVideo(e.target.result);
              
              // Store in Chrome storage
              chrome.storage.local.set(
                {backgroundVideo: e.target.result}, 
                () => {
                  console.log("Video saved successfully");
                }
              );
            } catch (playError) {
              console.error("Video playback error:", playError);
              alert("Could not play the video. Ensure it's a valid, non-corrupted video file.");
            }
          };
  
          reader.onerror = (error) => {
            console.error("File reading error:", error);
            alert("Error reading the video file.");
          };
  
          reader.readAsDataURL(file);
        } catch (validationError) {
          alert(validationError.message);
        }
      };
  
      input.click();
    });
  
    // Load previously saved video on page load
    chrome.storage.local.get(['backgroundVideo'], function(result) {
      if (result.backgroundVideo) {
        setupVideo(result.backgroundVideo).catch(console.error);
      }
    });
  })();