
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import "./ComparisonSlider.css";

const ComparisonSlider = ({ topImage, bottomImage }) => {
    const [isResizing, setIsResizing] = useState(false);
    const topImageRef: any = useRef();
    const handleRef: any = useRef();

    const setPositioning = useCallback((x: any) => {
        const { left, width } = topImageRef.current.getBoundingClientRect();
        const handleWidth = handleRef.current.offsetWidth;

        if (x >= left && x <= width + left - handleWidth) {
            handleRef.current.style.left = `${((x - left) / width) * 100}%`;
            topImageRef.current.style.clipPath = `inset(0 ${100 - ((x - left) / width) * 100
                }% 0 0)`;
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

        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("touchmove", handleResize);
        window.removeEventListener("mouseup", handleResizeEnd);
        window.removeEventListener("touchend", handleResizeEnd);
    }, [handleResize]);

    const onKeyDown = useCallback(
        (e: any) => {
            const { offsetLeft, offsetParent } = handleRef.current;

            if (e.code === "ArrowLeft") {
                setPositioning(offsetLeft + offsetParent.offsetLeft - 10);
            }

            if (e.code === "ArrowRight") {
                setPositioning(offsetLeft + offsetParent.offsetLeft + 10);
            }
        },
        [setPositioning]
    );

    // Add keydown event on mount
    useEffect(() => {
        window.addEventListener("keydown", onKeyDown);
    }, [onKeyDown]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", handleResize);
            window.addEventListener("touchmove", handleResize);
            window.addEventListener("mouseup", handleResizeEnd);
            window.addEventListener("touchend", handleResizeEnd);
        }

        return () => {
            window.removeEventListener("mousemove", handleResize);
            window.addEventListener("touchmove", handleResize);
            window.removeEventListener("mouseup", handleResizeEnd);
            window.removeEventListener("touchend", handleResizeEnd);
            window.removeEventListener("keyup", onKeyDown);
        };
    }, [isResizing, handleResize, handleResizeEnd, onKeyDown]);

    console.log("A", bottomImage)
    return <>
        <div className="comparison-slider">
            <div
                ref={handleRef}
                className="handle"
                onMouseDown={() => setIsResizing(true)}
                onTouchStart={() => setIsResizing(true)}
            >
                <div class="handle-btn">
                    <div class={`${!bottomImage ? "hide" : ""}`}>
                        <i class={`fa-solid fa-arrow-right-arrow-left`}></i>
                    </div>
                    <div class={`${bottomImage ? "hide" : ""}`}>
                        <i class={`fa-solid fa-spinner-scale fa-spin-pulse`}></i>
                    </div>
                </div>
            </div>


            <div ref={topImageRef} className="comparison-item top">
                <img draggable={false} src={topImage} alt={"original"} />
            </div>
            <div className="comparison-item">
                {bottomImage ?
                    <div style={{ position: 'relative' }}>
                        <img src={topImage} alt="Uploaded preview" style={{ maxWidth: '1024px' }} />
                        <img
                            src={bottomImage}
                            alt="Mask"
                            style={{ maxWidth: '1024px', position: 'absolute', top: 0, left: 0, opacity: 0.65 }}
                        />
                    </div>
                    :
                    <div style={{ position: 'relative' }}>
                        <img src={"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="} alt="Uploaded preview" style={{ width: '800px', maxHeight: '400px', maxWidth: '1024px' }} />
                    </div>
                }
            </div>
        </div >
    </>

};

export default ComparisonSlider;
