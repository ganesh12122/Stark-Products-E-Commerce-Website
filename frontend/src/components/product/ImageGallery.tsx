import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Image {
  url: string;
  alt: string;
}

const ImageGallery = ({ images }: { images: Image[] }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="relative">
      <div className="aspect-w-1 aspect-h-1 mb-4">
        <motion.div
          className="relative cursor-zoom-in"
          onHoverStart={() => setIsZoomed(true)}
          onHoverEnd={() => setIsZoomed(false)}
        >
          <img
            src={images[selectedImage].url}
            alt={images[selectedImage].alt}
            loading="lazy"
            className="w-full h-full object-cover rounded-lg"
          />
          <AnimatePresence>
            {isZoomed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white"
              >
                <img
                  src={images[selectedImage].url}
                  alt={images[selectedImage].alt}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative rounded-lg overflow-hidden ${
              selectedImage === index ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <img
              src={image.url}
              alt={image.alt}
              loading="lazy"
              className="w-full h-24 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery; 