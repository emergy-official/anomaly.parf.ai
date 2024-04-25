import { useState, useEffect, useRef, useCallback } from 'react';
import './ComparisonSlider.css';
import { ArrowRightLeft } from '~/components/ui/icons/ArrowRightLeft';
import { Loader2 } from '~/components/ui/icons/Loader2';

const ComparisonSlider = ({ topImage, bottomImage, loading, className }) => {
  const [isResizing, setIsResizing] = useState(false);
  const topImageRef: any = useRef();
  const handleRef: any = useRef();

  const setPositioning = useCallback((x: any) => {
    const { left, width } = topImageRef.current.getBoundingClientRect();
    const handleWidth = handleRef.current.offsetWidth;

    if (x >= left && x <= width + left - handleWidth) {
      handleRef.current.style.left = `${((x - left) / width) * 100}%`;
      topImageRef.current.style.clipPath = `inset(0 ${100 - ((x - left) / width) * 100}% 0 0)`;
    }
  }, []);

  const handleResize = useCallback(
    (e: any) => {
      if (e.clientX) {
        setPositioning(e.clientX);
      } else if (e.touches[0] && e.touches[0].clientX) {
        setPositioning(e.touches[0].clientX);
      }
    },
    [setPositioning]
  );

  // Set initial positioning on component mount
  useEffect(() => {
    const { left, width } = topImageRef.current.getBoundingClientRect();
    const handleWidth = handleRef.current.offsetWidth;

    setPositioning(width / 2 + left - handleWidth / 2);
  }, [setPositioning, bottomImage]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);

    window.removeEventListener('mousemove', handleResize);
    window.removeEventListener('touchmove', handleResize);
    window.removeEventListener('mouseup', handleResizeEnd);
    window.removeEventListener('touchend', handleResizeEnd);
  }, [handleResize]);

  const onKeyDown = useCallback(
    (e: any) => {
      const { offsetLeft, offsetParent } = handleRef.current;

      if (e.code === 'ArrowLeft') {
        setPositioning(offsetLeft + offsetParent.offsetLeft - 10);
      }

      if (e.code === 'ArrowRight') {
        setPositioning(offsetLeft + offsetParent.offsetLeft + 10);
      }
    },
    [setPositioning]
  );

  // Add keydown event on mount
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('touchmove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchend', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.addEventListener('touchmove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchend', handleResizeEnd);
      window.removeEventListener('keyup', onKeyDown);
    };
  }, [isResizing, handleResize, handleResizeEnd, onKeyDown]);

  return (
    <>
      <div className={className}>
        <div
          ref={handleRef}
          className="handle"
          onMouseDown={() => setIsResizing(true)}
          onTouchStart={() => setIsResizing(true)}
        >
          <div className="handle-btn">
            <div className={`${loading ? 'hide' : ''}`}>
              <ArrowRightLeft />
            </div>
            <div className={`${!loading ? 'hide' : ''}`}>
              <Loader2 />
            </div>
          </div>
        </div>

        <div ref={topImageRef} className="comparison-item top">
          <img draggable={false} src={topImage} alt={'original'} />
        </div>
        <div className="comparison-item">
          {bottomImage ? (
            <div style={{ position: 'relative' }}>
              <img src={topImage} alt="Uploaded preview" style={{ width: '512px' }} />
              <img
                src={bottomImage}
                alt="Mask"
                style={{ maxWidth: '512px', position: 'absolute', top: 0, left: 0, opacity: 1 }}
              />
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <img
                src={
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
                }
                alt="Uploaded preview"
                style={{ width: '512px', maxHeight: '512px', maxWidth: '512px' }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ComparisonSlider;
