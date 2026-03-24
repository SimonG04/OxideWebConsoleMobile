/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */
import cn from 'classnames'
import { createContext, forwardRef, useRef, useState } from 'react'
import { Outlet } from 'react-router'

import { PageActionsTarget } from '~/components/PageActions'
import { Pagination } from '~/components/Pagination'
import { useScrollRestoration } from '~/hooks/use-scroll-restoration'
import { SkipLinkTarget } from '~/ui/lib/SkipLink'
import { classed } from '~/util/classed'

interface MobileMenuContextValue {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const MobileMenuContext = createContext<MobileMenuContextValue>({
  isOpen: false,
  setIsOpen: () => {},
})

export const PageContainer = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, children, ...props }, ref) => {
    const[isOpen, setIsOpen] = useState(false)
    return (
      <MobileMenuContext.Provider value={{ isOpen, setIsOpen }}>
        <div
          ref={ref}
          className={cn(
            'flex h-screen flex-col overflow-hidden md:grid md:grid-cols-[14.25rem_1fr] md:grid-rows-[var(--top-bar-height)_1fr]',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </MobileMenuContext.Provider>
    )
  }
)
PageContainer.displayName = 'PageContainer'

export function ContentPane() {
  const ref = useRef<HTMLDivElement>(null)
  useScrollRestoration(ref)
  return (
    <div
      ref={ref}
      className="light:bg-raise flex flex-1 flex-col overflow-auto md:flex-auto"
      id="scroll-container"
      data-testid="scroll-container"
    >
      <div className="flex grow flex-col pb-8">
        <SkipLinkTarget />
        <main className="*:gutter">
          <Outlet />
        </main>
      </div>
      <div className="bg-default border-secondary sticky bottom-0 z-(--z-top-bar) shrink-0 justify-between overflow-hidden border-t empty:border-t-0">
        <Pagination.Target />
        <PageActionsTarget />
      </div>
    </div>
  )
}

/**
 * Special content pane for the serial console that lets us break out of the
 * usual layout. Main differences: no `pb-8` and `<main>` is locked at `h-full`
 * to avoid page-level scroll. We also leave off the pagination and page actions
 * `<div>` because we don't need it.
 */
export const SerialConsoleContentPane = () => (
  <div className="flex flex-1 flex-col overflow-auto md:flex-auto">
    <div className="flex grow flex-col">
      <SkipLinkTarget />
      <main className="*:gutter h-full">
        <Outlet />
      </main>
    </div>
  </div>
)
