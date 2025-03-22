
import * as React from "react"

// Define standard breakpoints
export const BREAKPOINTS = {
  mobile: 640,    // sm
  tablet: 768,    // md
  laptop: 1024,   // lg
  desktop: 1280,  // xl
}

export function useIsMobile() {
  const [windowSize, setWindowSize] = React.useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  React.useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobileValue = windowSize.width ? windowSize.width < BREAKPOINTS.mobile : false;
  const isTabletValue = windowSize.width ? windowSize.width >= BREAKPOINTS.mobile && windowSize.width < BREAKPOINTS.laptop : false;
  const isDesktopValue = windowSize.width ? windowSize.width >= BREAKPOINTS.laptop : true;

  // This allows both ways of using the hook:
  // 1. As a direct boolean: const isMobile = useIsMobile();
  // 2. As an object with additional properties: const { isMobile, isTablet, ... } = useIsMobile();
  const result = isMobileValue as unknown as boolean & {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    windowSize: {
      width: number | undefined;
      height: number | undefined;
    };
  };

  // Assign properties to the result
  result.isMobile = isMobileValue;
  result.isTablet = isTabletValue;
  result.isDesktop = isDesktopValue;
  result.windowSize = windowSize;

  return result;
}
