export default defineAppConfig({
  ui: {
    avatar: {
      defaultVariants: { size: 'lg', variant: 'soft' }
    },
    badge: {
      defaultVariants: { size: 'lg', variant: 'soft' }
    },
    button: {
      defaultVariants: { size: 'lg', variant: 'soft' }
    },
    toggle: {
      defaultVariants: { size: 'lg', variant: 'soft' }
    },
    checkbox: {
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'soft'
      }
    },
    radioGroup: {
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'soft'
      }
    },
    selectMenu: {
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'soft'
      }
    },
    input: {
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'soft'
      }
    },
    textarea: {
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'soft'
      }
    },
    select: {
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'soft'
      }
    },
    pageCard: {
      variants: {
        variant: {
          soft: {
            root: 'bg-neutral-100/15 border-0 divide-y divide-dotted shadow-lg hover:shadow-2xl hover:-translate-y-0.6 transition-all duration-300',
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
            root: 'bg-neutral-100/15 border-0 divide-y divide-dotted shadow-lg hover:shadow-2xl hover:-translate-y-0.6 transition-all duration-300'
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
    }
  }
})
