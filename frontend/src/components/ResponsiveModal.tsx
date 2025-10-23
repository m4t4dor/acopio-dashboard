import { Modal, ModalProps } from 'antd'
import { ReactNode } from 'react'
import { useScreenSize } from '@/hooks/useBreakpoint'

interface ResponsiveModalProps extends ModalProps {
  children: ReactNode
  mobileFullScreen?: boolean
}

const ResponsiveModal = ({ 
  children, 
  mobileFullScreen = true,
  width = 520,
  ...modalProps 
}: ResponsiveModalProps) => {
  const { isMobile, isTablet } = useScreenSize()

  const modalConfig: ModalProps = {
    ...modalProps,
    width: isMobile ? '100vw' : isTablet ? '90vw' : width,
    style: isMobile ? {
      top: 0,
      paddingBottom: 0,
      maxWidth: '100vw',
      margin: 0,
    } : isTablet ? {
      top: 20,
      paddingBottom: 0,
      maxWidth: '90vw',
      margin: '20px auto',
    } : modalProps.style,
    styles: {
      body: isMobile ? {
        maxHeight: mobileFullScreen ? 'calc(100vh - 100px)' : 'calc(90vh - 120px)',
        minHeight: mobileFullScreen ? 'calc(100vh - 100px)' : undefined,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px 16px',
      } : isTablet ? {
        maxHeight: 'calc(100vh - 140px)',
        overflowY: 'auto',
        padding: '20px',
        ...modalProps.styles?.body
      } : {
        maxHeight: 'calc(90vh - 120px)',
        overflowY: 'auto',
        padding: '24px',
        ...modalProps.styles?.body
      },
      ...modalProps.styles
    },
    centered: !isMobile && modalProps.centered !== false,
    destroyOnHidden: true,
  }

  return (
    <Modal {...modalConfig}>
      <div style={isMobile ? { width: '100%', maxWidth: '100%' } : undefined}>
        {children}
      </div>
    </Modal>
  )
}

export default ResponsiveModal
