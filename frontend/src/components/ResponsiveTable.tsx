import { Table, TableProps } from 'antd'
import { ReactNode } from 'react'

interface ResponsiveTableProps<T> extends TableProps<T> {
  mobileCard?: (record: T, index: number) => ReactNode
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl'
}

const ResponsiveTable = <T extends Record<string, any>>({
  mobileCard,
  breakpoint = 'md',
  className = '',
  ...tableProps
}: ResponsiveTableProps<T>) => {
  
  return (
    <div className="overflow-x-auto">
      <Table
        {...tableProps}
        className={`${className} responsive-table`}
        scroll={{ x: 'max-content', ...tableProps.scroll }}
        pagination={{
          responsive: true,
          showTotal: (total, range) => (
            <span className="text-sm text-gray-600">
              {range ? `${range[0]}-${range[1]} de ${total} resultados` : `${total} resultados`}
            </span>
          ),
          showSizeChanger: true,
          showQuickJumper: window.innerWidth > 768,
          pageSizeOptions: ['10', '15', '25', '50'],
          ...tableProps.pagination,
        }}
      />
    </div>
  )
}

export default ResponsiveTable
