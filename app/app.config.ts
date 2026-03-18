export default defineAppConfig({
  ui: {
    pageCard: {
      variants: {
        variant: {
          soft: {
            root: 'bg-neutral-100/15 border-0 divide-y divide-dotted shadow-lg',
            description: 'text-toned'
          }
        }
      },
      defaultVariants: {
        variant: 'soft'
      }
    },
    card: {
      slots: {
        root: 'rounded-lg overflow-hidden',
        header: 'p-4 sm:px-6',
        body: 'p-4 sm:p-6',
        footer: 'p-4 sm:px-6'
      },
      variants: {
        variant: {
          soft: {
            root: 'bg-neutral-100/15 border-0 divide-y divide-dotted shadow-md'
          }
        }
      },
      defaultVariants: {
        variant: 'soft'
      }
    },
    colors: {
      primary: 'orange',
      neutral: 'zinc'
    },
    formField: {
      slots: {
        description: 'text-sm text-dimmed'
      }
    },
    avatar: { defaultVariants: { size: 'lg' } },
    badge: { defaultVariants: { size: 'lg' } },
    button: { defaultVariants: { size: 'lg' } },
    checkbox: { defaultVariants: { size: 'lg' } },
    input: { defaultVariants: { size: 'lg' } },
    radioGroup: { defaultVariants: { size: 'lg' } },
    select: { defaultVariants: { size: 'lg' } },
    selectMenu: { defaultVariants: { size: 'lg' } },
    textarea: { defaultVariants: { size: 'lg' } },
    toggle: { defaultVariants: { size: 'lg' } }
  }
})
