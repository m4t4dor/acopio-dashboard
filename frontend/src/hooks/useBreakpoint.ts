import { useState, useEffect } from 'react'

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1600,
}

export const useBreakpoint = (breakpoint: BreakpointKey) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpoint]}px)`
    const media = window.matchMedia(query)
    
    const updateMatch = () => {
      setMatches(media.matches)
    }

    updateMatch()
    media.addEventListener('change', updateMatch)

    return () => {
      media.removeEventListener('change', updateMatch)
    }
  }, [breakpoint])

  return matches
}

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<BreakpointKey>('xs')

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      
      if (width >= breakpoints['3xl']) {
        setScreenSize('3xl')
      } else if (width >= breakpoints['2xl']) {
        setScreenSize('2xl')
      } else if (width >= breakpoints.xl) {
        setScreenSize('xl')
      } else if (width >= breakpoints.lg) {
        setScreenSize('lg')
      } else if (width >= breakpoints.md) {
        setScreenSize('md')
      } else if (width >= breakpoints.sm) {
        setScreenSize('sm')
      } else {
        setScreenSize('xs')
      }
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)

    return () => {
      window.removeEventListener('resize', updateScreenSize)
    }
  }, [])

  return {
    screenSize,
    isXs: screenSize === 'xs',
    isSm: screenSize === 'sm',
    isMd: screenSize === 'md',
    isLg: screenSize === 'lg',
    isXl: screenSize === 'xl',
    is2Xl: screenSize === '2xl',
    is3Xl: screenSize === '3xl',
    isMobile: ['xs', 'sm'].includes(screenSize),
    isTablet: screenSize === 'md',
    isDesktop: ['lg', 'xl', '2xl', '3xl'].includes(screenSize),
  }
}
