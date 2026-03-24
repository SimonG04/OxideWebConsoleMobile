/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import cn from 'classnames'
import React, { useRef, useState, useEffect, type JSX, type ReactElement } from 'react'
import SimpleBar from 'simplebar-react'

import { useIsOverflow } from '~/hooks/use-is-overflow'
import { classed } from '~/util/classed'

export const TableContext = React.createContext<{ isCardView: boolean }>({ isCardView: false })
export const useTableContext = () => React.useContext(TableContext)

export type TableProps = JSX.IntrinsicElements['table']
export function Table({ className, ...props }: TableProps) {
  const overflowRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const { isOverflow, scrollStart, scrollEnd } = useIsOverflow(overflowRef, 'horizontal')
  const [isCardView, setIsCardView] = useState(false)

  // Sync headers to td data-labels for mobile card view
  useEffect(() => {
    if (isCardView && tableRef.current) {
      const theadRows = Array.from(tableRef.current.querySelectorAll('thead tr'))

      // Build a 2D representation of the headers to support colspans/rowspans
      const grid: { text: string; isGroup: boolean; th: Element }[][] =[]
      theadRows.forEach((row, rowIndex) => {
        const ths = Array.from(row.querySelectorAll('th'))
        let colIndex = 0
        ths.forEach((th) => {
          while (grid[rowIndex] && grid[rowIndex][colIndex]) {
            colIndex++
          }
          const colspan = parseInt(th.getAttribute('colspan') || '1', 10)
          const rowspan = parseInt(th.getAttribute('rowspan') || '1', 10)

          // Fallback to accessibility tags or explicit mobile labels for empty <th> texts (like ID or Actions)
          const text = th.getAttribute('data-mobile-label') || th.getAttribute('aria-label') || th.textContent?.trim() || (colIndex === 0 ? 'ID' : '')

          for (let r = 0; r < rowspan; r++) {
            for (let c = 0; c < colspan; c++) {
              if (!grid[rowIndex + r]) grid[rowIndex + r] = []
              grid[rowIndex + r][colIndex + c] = { text, isGroup: colspan > 1, th }
            }
          }
          colIndex += colspan
        })
      })

      const lastRow = grid[grid.length - 1] ||[]
      const headers = lastRow.map((cell) => (cell ? cell.text : ''))

      const rows = tableRef.current.querySelectorAll('tbody tr')
      rows.forEach((row) => {
        const tds = Array.from(row.querySelectorAll('td'))
        tds.forEach((td, index) => {
          if (headers[index]) {
            td.setAttribute('data-label', headers[index])
          } else {
            td.removeAttribute('data-label')
          }

          // Inject group headings from preceding header rows
          if (grid.length > 1) {
            const currentGroup = grid[grid.length - 2][index]
            const prevGroup = index > 0 ? grid[grid.length - 2][index - 1] : null
            if (currentGroup && currentGroup.isGroup && currentGroup.text) {
              if (!prevGroup || prevGroup.th !== currentGroup.th) {
                td.setAttribute('data-group-label', currentGroup.text)
              } else {
                td.removeAttribute('data-group-label')
              }
            } else {
              td.removeAttribute('data-group-label')
            }
          }
        })
      })
    }
  }, [isCardView, props.children])

  return (
    <TableContext.Provider value={{ isCardView }}>
    <div className="relative group/table-wrapper">
      <button
        className={cn(
          "md:hidden flex h-8 w-12 items-center justify-center text-quaternary hover:text-default border border-secondary border-b-0 rounded-t-lg focus:outline-none relative z-[1] pb-px -mb-px",
          isCardView ? "bg-secondary light:bg-[#fdfdfd]" : "bg-secondary"
        )}
        onClick={() => setIsCardView(!isCardView)}
        aria-label={isCardView ? 'Switch to table view' : 'Switch to card view'}
        type="button"
      >
        {isCardView ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v10H2V3zm2 2v2h3V5H4zm5 0v2h3V5H9zm-5 3v2h3V8H4zm5 0v2h3V8H9z"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v3H2V3zm0 5h12v3H2V8zm0 5h12v3H2v-3z"/></svg>
        )}
      </button>

      {!isCardView && isOverflow && (
        <>
          {!scrollStart && (
            <button
              type="button"
              onClick={() => overflowRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
              className="absolute top-1/2 -translate-y-1/2 left-0 z-10 flex h-10 w-6 items-center justify-center bg-raise/90 shadow-sm border border-secondary border-l-0 rounded-r-md text-secondary hover:text-default backdrop-blur-sm md:hidden focus:outline-none"
              aria-label="Scroll left"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 13.5L4 8l6.5-5.5v11z"/></svg>
            </button>
          )}
          {!scrollEnd && (
            <button
              type="button"
              onClick={() => overflowRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-10 flex h-10 w-6 items-center justify-center bg-raise/90 shadow-sm border border-secondary border-r-0 rounded-l-md text-secondary hover:text-default backdrop-blur-sm md:hidden focus:outline-none"
              aria-label="Scroll right"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 2.5L12 8l-6.5 5.5v-11z"/></svg>
            </button>
          )}
        </>
      )}

      <SimpleBar
        scrollableNodeProps={{ ref: overflowRef }}
        className={cn(
          'overflow-x-auto rounded-md',
          !isCardView && 'pb-4',
          !scrollStart && !isCardView && 'scrolled',
          isOverflow && !scrollEnd && !isCardView && 'overflowing'
        )}
        autoHide={false}
      >
        <table
          ref={tableRef}
          className={cn(className, 'ox-table text-sans-md w-full border-separate', { 'card-view': isCardView })}
          {...props}
        />
      </SimpleBar>
    </div>
    </TableContext.Provider>
  )
}

export type TableHeaderRowProps = JSX.IntrinsicElements['tr']
Table.HeaderRow = (props: TableHeaderRowProps) => <Table.Row {...props} />

export type TableHeaderProps = JSX.IntrinsicElements['thead']
Table.Header = ({ children, className }: TableHeaderProps) => (
  <thead className={cn('text-mono-sm text-secondary text-left', className)}>
    {children}
  </thead>
)

export type TableHeadCellProps = JSX.IntrinsicElements['th']
Table.HeadCell = ({ className, children, ...props }: TableHeadCellProps) => (
  <th
    className={cn(
      className,
      'text-mono-sm bg-secondary border-default h-9 border-y pr-px pl-0 text-left'
    )}
    {...props}
  >
    <div className="border-secondary flex h-full items-center border-l px-3">
      {children}
    </div>
  </th>
)

export type TableRowProps = JSX.IntrinsicElements['tr'] & {
  selected?: boolean
}
Table.Row = ({ className, selected, ...props }: TableRowProps) => (
  <tr className={cn('bg-default', className, selected && 'is-selected')} {...props} />
)

type RowElt = ReactElement<TableRowProps>

export type TableBodyProps = JSX.IntrinsicElements['tbody']
Table.Body = ({ className, children, ...props }: TableBodyProps) => {
  const rows = React.Children.toArray(children).map((c, i, siblings) => {
    const child = c as RowElt
    const beforeSelected = (siblings[i - 1] as RowElt | undefined)?.props.selected
    const afterSelected = (siblings[i + 1] as RowElt | undefined)?.props.selected
    const className =
      child.props.selected && (beforeSelected || afterSelected)
        ? cn(
            child.props.className,
            'multi-selection',
            !beforeSelected && 'selection-start',
            !afterSelected && 'selection-end'
          )
        : child.props.className
    return React.cloneElement(child, { ...child.props, className })
  })
  return (
    <tbody className={className} {...props}>
      {rows}
    </tbody>
  )
}

export type TableCellProps = JSX.IntrinsicElements['td'] & { height?: 'small' | 'large' }
Table.Cell = ({ height = 'small', className, children, ...props }: TableCellProps) => (
  <td
    className={cn(className, 'text-raise border-default pl-0 first:*:border-l-0')}
    {...props}
  >
    <div
      className={cn(
        'border-secondary relative flex items-center overflow-hidden border-b border-l px-3 py-2',
        { 'h-11': height === 'small', 'h-14': height === 'large' }
      )}
    >
      {children}
    </div>
  </td>
)

/**
 * Used _outside_ of the `Table`, this element wraps buttons that sit on top
 * of the table.
 */
export const TableActions = classed.div`-mt-6 mb-3 flex justify-end gap-2`

type TableEmptyBoxProps = {
  children: React.ReactNode
  border?: boolean
}

export const TableEmptyBox = ({ children, border = true }: TableEmptyBoxProps) => (
  <div
    className={cn('flex h-full max-h-[480px] items-center justify-center rounded-lg px-4', {
      'border-secondary border py-4': border,
    })}
  >
    {children}
  </div>
)

export const TableTitle = classed.div`text-sans-lg text-raise`
