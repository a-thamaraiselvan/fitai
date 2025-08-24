import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, RotateCw } from 'lucide-react';
import Button from '../UI/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ProfilePictureUploadProps {
  currentPicture?: string;
  onUpdate: (newPictureUrl: string) => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  onUpdate
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(200);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageSize({ width: naturalWidth, height: naturalHeight });
      
      // Center the crop area
      const size = Math.min(naturalWidth, naturalHeight, 400);
      setCropSize(size);
      setCropPosition({
        x: (naturalWidth - size) / 2,
        y: (naturalHeight - size) / 2
      });
    }
  }, []);

  const handleCropPositionChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const x = Math.max(0, Math.min((e.clientX - rect.left) * scaleX - cropSize / 2, imageSize.width - cropSize));
    const y = Math.max(0, Math.min((e.clientY - rect.top) * scaleY - cropSize / 2, imageSize.height - cropSize));
    
    setCropPosition({ x, y });
  };

  const cropImage = useCallback(() => {
    if (!selectedImage || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    const img = new Image();
    img.onload = () => {
      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropPosition.x,
        cropPosition.y,
        cropSize,
        cropSize,
        0,
        0,
        300,
        300
      );

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCroppedImage(croppedDataUrl);
    };
    img.src = selectedImage;
  }, [selectedImage, cropPosition, cropSize]);

  const uploadImage = async () => {
    if (!croppedImage) return;

    setUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('profilePicture', blob, 'profile.jpg');

      const uploadResponse = await api.post('/auth/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUpdate(uploadResponse.data.profilePicture);
      setShowCropModal(false);
      setSelectedImage(null);
      setCroppedImage(null);
      toast.success('Profile picture updated successfully! ✨');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const resetCrop = () => {
    setShowCropModal(false);
    setSelectedImage(null);
    setCroppedImage(null);
    setCropPosition({ x: 0, y: 0 });
  };

  return (
    <>
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            {currentPicture ? (
              <img
                src={currentPicture}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="text-white text-4xl font-bold">
                {/* User initial placeholder */}
                👤
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <Button
            onClick={() => cameraInputRef.current?.click()}
            icon={Camera}
            size="sm"
            variant="outline"
          >
            Camera
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            icon={Upload}
            size="sm"
            variant="outline"
          >
            Gallery
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Crop Modal */}
      {showCropModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Crop Profile Picture</h3>
                <Button
                  onClick={resetCrop}
                  variant="ghost"
                  icon={X}
                  size="sm"
                />
              </div>

              {/* Image Crop Area */}
              <div className="relative mb-4">
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Crop preview"
                  className="w-full max-h-64 object-contain cursor-crosshair"
                  onLoad={handleImageLoad}
                  onClick={handleCropPositionChange}
                />
                
                {/* Crop Overlay */}
                {imageRef.current && (
                  <div
                    className="absolute border-2 border-white shadow-lg rounded-full pointer-events-none"
                    style={{
                      left: `${(cropPosition.x / imageSize.width) * 100}%`,
                      top: `${(cropPosition.y / imageSize.height) * 100}%`,
                      width: `${(cropSize / imageSize.width) * 100}%`,
                      height: `${(cropSize / imageSize.height) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Crop Size Control */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Size
                </label>
                <input
                  type="range"
                  min={Math.min(100, Math.min(imageSize.width, imageSize.height))}
                  max={Math.min(imageSize.width, imageSize.height)}
                  value={cropSize}
                  onChange={(e) => setCropSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Preview */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-cover"
                      style={{ display: croppedImage ? 'block' : 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={cropImage}
                  icon={RotateCw}
                  variant="outline"
                  className="flex-1"
                >
                  Preview Crop
                </Button>
                <Button
                  onClick={uploadImage}
                  loading={uploading}
                  icon={Check}
                  className="flex-1"
                  disabled={!croppedImage}
                >
                  Save Picture
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePictureUpload;