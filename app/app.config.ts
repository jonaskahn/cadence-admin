export default defineAppConfig({
  ui: {
    avatar: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: { size: 'lg', variant: 'subtle' }
    },
    badge: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: { size: 'lg', variant: 'subtle' }
    },
    button: {
      defaultVariants: { size: 'lg', variant: 'soft' }
    },
    toggle: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: { size: 'lg', variant: 'subtle' }
    },
    checkbox: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'subtle'
      }
    },
    radioGroup: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'subtle'
      }
    },
    selectMenu: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'subtle'
      }
    },
    input: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'subtle'
      }
    },
    textarea: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'subtle'
      }
    },
    select: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'subtle'
      }
    },
    pageCard: {
      variants: {
        variant: {
          soft: {
            root: 'bg-neutral-100 border border-accented border-dotted divide-y divide-dashed shadow-sm backdrop-blur supports-backdrop-filter:bg-default/40 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300',
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
            root: 'bg-neutral-100 border border-accented border-dotted divide-y divide-dashed shadow-sm backdrop-blur supports-backdrop-filter:bg-default/40 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
          }
        }
      },
      defaultVariants: {
        variant: 'soft'
      }
    },
    colors: {
      primary: 'orange',
      neutral: 'stone'
    },
    formField: {
      slots: {
        description: 'text-xs text-dimmed'
      }
    }
  }
})
