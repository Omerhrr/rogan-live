import { ref, computed, onMounted, onUnmounted, readonly } from 'vue';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 960,
  lg: 1280,
  xl: 1920,
};

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768);

let resizeHandler: (() => void) | null = null;
let listeners = 0;

function onResize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

export function useResponsive() {
  const currentBreakpoint = computed<Breakpoint>(() => {
    const w = windowWidth.value;
    if (w >= BREAKPOINTS.xl) return 'xl';
    if (w >= BREAKPOINTS.lg) return 'lg';
    if (w >= BREAKPOINTS.md) return 'md';
    if (w >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  });

  const isMobile = computed(() => windowWidth.value < BREAKPOINTS.md);
  const isTablet = computed(() => windowWidth.value >= BREAKPOINTS.sm && windowWidth.value < BREAKPOINTS.lg);
  const isDesktop = computed(() => windowWidth.value >= BREAKPOINTS.md);
  const isLargeDesktop = computed(() => windowWidth.value >= BREAKPOINTS.lg);

  // Convenience: which layout to render
  const layoutMode = computed<'mobile' | 'desktop'>(() =>
    isDesktop.value ? 'desktop' : 'mobile'
  );

  onMounted(() => {
    listeners++;
    if (!resizeHandler) {
      resizeHandler = onResize;
      window.addEventListener('resize', resizeHandler, { passive: true });
    }
    onResize();
  });

  onUnmounted(() => {
    listeners--;
    if (listeners === 0 && resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
  });

  return {
    windowWidth: readonly(windowWidth),
    windowHeight: readonly(windowHeight),
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    layoutMode,
    breakpoints: BREAKPOINTS,
  };
}
