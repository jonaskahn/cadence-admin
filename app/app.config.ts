export default defineAppConfig({
  ui: {
    badge: {
      slots: {
        base: 'rounded-2xl border border-primary-100 border-dotted bg-primary-300 font-medium inline-flex items-center',
        label: 'truncate',
        leadingIcon: 'shrink-0',
        leadingAvatar: 'shrink-0',
        leadingAvatarSize: '',
        trailingIcon: 'shrink-0'
      },
      size: {
        xs: {
          base: 'text-[8px]/3 px-1 py-0.5 gap-1 rounded-2xl',
          leadingIcon: 'size-3',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-3'
        },
        sm: {
          base: 'text-[10px]/3 px-1.5 py-1 gap-1 rounded-2xl',
          leadingIcon: 'size-3',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-3'
        },
        md: {
          base: 'text-xs px-2 py-1 gap-1 rounded-2xl',
          leadingIcon: 'size-4',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-4'
        },
        lg: {
          base: 'text-sm px-2 py-1 gap-1.5 rounded-2xl',
          leadingIcon: 'size-5',
          leadingAvatarSize: '2xs',
          trailingIcon: 'size-5'
        },
        xl: {
          base: 'text-base px-2.5 py-1 gap-1.5 rounded-2xl',
          leadingIcon: 'size-6',
          leadingAvatarSize: '2xs',
          trailingIcon: 'size-6'
        }
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300 text-inverted bg-primary hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
        },
        {
          color: 'primary',
          variant: 'outline',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300 ring ring-inset ring-primary/50 text-primary hover:bg-primary/10 active:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        },
        {
          color: 'primary',
          variant: 'soft',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/15 focus:outline-none focus-visible:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10'
        },
        {
          color: 'primary',
          variant: 'subtle',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-primary ring ring-inset ring-primary/25 bg-primary/10 hover:bg-primary/15 active:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        },
        {
          color: 'primary',
          variant: 'ghost',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-primary hover:bg-primary/10 active:bg-primary/10 focus:outline-none focus-visible:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
        },
        {
          color: 'primary',
          variant: 'link',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-primary hover:text-primary/75 active:text-primary/75 disabled:text-primary aria-disabled:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
        },
        {
          color: 'neutral',
          variant: 'solid',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-inverted bg-inverted hover:bg-inverted/90 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted'
        },
        {
          color: 'neutral',
          variant: 'outline',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  ring ring-inset ring-accented text-default bg-default hover:bg-elevated active:bg-elevated disabled:bg-default aria-disabled:bg-default focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted'
        },
        {
          color: 'neutral',
          variant: 'soft',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-default hover:bg-accented/75 active:bg-accented/75 focus:outline-none focus-visible:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated'
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  ring ring-inset ring-accented text-default hover:bg-accented/75 active:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted'
        },
        {
          color: 'neutral',
          variant: 'ghost',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-default hover:bg-elevated active:bg-elevated focus:outline-none focus-visible:bg-elevated hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent'
        },
        {
          color: 'neutral',
          variant: 'link',
          class:
            'rounded-2xl border border-primary-100 border-dotted bg-primary-300  text-muted hover:text-default active:text-default disabled:text-muted aria-disabled:text-muted focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-inverted'
        },
        {
          size: 'xs',
          square: true,
          class: 'p-1'
        },
        {
          size: 'sm',
          square: true,
          class: 'p-1.5'
        },
        {
          size: 'md',
          square: true,
          class: 'p-1.5'
        },
        {
          size: 'lg',
          square: true,
          class: 'p-2'
        },
        {
          size: 'xl',
          square: true,
          class: 'p-2'
        },
        {
          loading: true,
          leading: true,
          class: {
            leadingIcon: 'animate-spin'
          }
        },
        {
          loading: true,
          leading: false,
          trailing: true,
          class: {
            trailingIcon: 'animate-spin'
          }
        }
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'soft',
        size: 'sm'
      }
    },
    dashboardSidebar: {
      slots: {
        header: 'border border-accented border-dotted h-(--ui-header-height) shrink-0 flex items-center gap-1.5 px-4'
      }
    },
    separator: {
      defaultVariants: {
        color: 'neutral',
        size: 'xs',
        type: 'dotted'
      }
    },
    avatar: {
      variants: {
        variant: {
          subtle:
            'text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: { size: 'lg', variant: 'subtle' }
    },
    button: {
      slots: {
        base: [
          'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75',
          'transition-colors'
        ],
        label: 'truncate',
        leadingIcon: 'shrink-0',
        leadingAvatar: 'shrink-0',
        leadingAvatarSize: '',
        trailingIcon: 'shrink-0'
      },
      variants: {
        fieldGroup: {
          horizontal:
            'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
          vertical:
            'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
        },
        color: {
          primary: '',
          secondary: '',
          success: '',
          info: '',
          warning: '',
          error: '',
          neutral: ''
        },
        variant: {
          solid: '',
          outline: '',
          soft: '',
          subtle: '',
          ghost: '',
          link: ''
        },
        size: {
          xs: {
            base: 'px-2 py-1 text-xs gap-1',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4'
          },
          sm: {
            base: 'px-2.5 py-1.5 text-xs gap-1.5',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4'
          },
          md: {
            base: 'px-2.5 py-1.5 text-sm gap-1.5',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5'
          },
          lg: {
            base: 'px-3 py-2 text-sm gap-2',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5'
          },
          xl: {
            base: 'px-3 py-2 text-base gap-2',
            leadingIcon: 'size-6',
            leadingAvatarSize: 'xs',
            trailingIcon: 'size-6'
          }
        },
        block: {
          true: {
            base: 'w-full justify-center',
            trailingIcon: 'ms-auto'
          }
        },
        square: {
          true: ''
        },
        leading: {
          true: ''
        },
        trailing: {
          true: ''
        },
        loading: {
          true: ''
        },
        active: {
          true: {
            base: ''
          },
          false: {
            base: ''
          }
        }
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class:
            'rounded-3xl text-inverted bg-primary hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
        },
        {
          color: 'primary',
          variant: 'outline',
          class:
            'rounded-3xl ring ring-inset ring-primary/50 text-primary hover:bg-primary/10 active:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        },
        {
          color: 'primary',
          variant: 'soft',
          class:
            'rounded-3xl text-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/15 focus:outline-none focus-visible:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10'
        },
        {
          color: 'primary',
          variant: 'subtle',
          class:
            'rounded-3xl text-primary ring ring-inset ring-primary/25 bg-primary/10 hover:bg-primary/15 active:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        },
        {
          color: 'primary',
          variant: 'ghost',
          class:
            'rounded-3xl text-primary hover:bg-primary/10 active:bg-primary/10 focus:outline-none focus-visible:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
        },
        {
          color: 'primary',
          variant: 'link',
          class:
            'rounded-3xl text-primary hover:text-primary/75 active:text-primary/75 disabled:text-primary aria-disabled:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
        },
        {
          color: 'neutral',
          variant: 'solid',
          class:
            'rounded-3xl text-inverted bg-inverted hover:bg-inverted/90 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted'
        },
        {
          color: 'neutral',
          variant: 'outline',
          class:
            'rounded-3xl ring ring-inset ring-accented text-default bg-default hover:bg-elevated active:bg-elevated disabled:bg-default aria-disabled:bg-default focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted'
        },
        {
          color: 'neutral',
          variant: 'soft',
          class:
            'rounded-3xl text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 focus:outline-none focus-visible:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated'
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class:
            'rounded-3xl ring ring-inset ring-accented text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted'
        },
        {
          color: 'neutral',
          variant: 'ghost',
          class:
            'rounded-3xl text-default hover:bg-elevated active:bg-elevated focus:outline-none focus-visible:bg-elevated hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent'
        },
        {
          color: 'neutral',
          variant: 'link',
          class:
            'rounded-3xl text-muted hover:text-default active:text-default disabled:text-muted aria-disabled:text-muted focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-inverted'
        },
        {
          size: 'xs',
          square: true,
          class: 'p-1'
        },
        {
          size: 'sm',
          square: true,
          class: 'p-1.5'
        },
        {
          size: 'md',
          square: true,
          class: 'p-1.5'
        },
        {
          size: 'lg',
          square: true,
          class: 'p-2'
        },
        {
          size: 'xl',
          square: true,
          class: 'p-2'
        },
        {
          loading: true,
          leading: true,
          class: {
            leadingIcon: 'animate-spin'
          }
        },
        {
          loading: true,
          leading: false,
          trailing: true,
          class: {
            trailingIcon: 'animate-spin'
          }
        }
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'soft',
        size: 'lg'
      }
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
            'rounded-3xl text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
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
            'rounded-3xl text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
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
            'rounded-3xl text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
        }
      },
      defaultVariants: {
        size: 'lg',
        color: 'primary',
        variant: 'subtle'
      }
    },
    inputNumber: {
      variants: {
        variant: {
          subtle:
            'rounded-3xl text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
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
            'rounded-3xl text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
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
            'rounded-3xl text-highlighted bg-default shadow-sm ring ring-inset ring-accented hover:bg-neutral-50/5 disabled:bg-elevated/50 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
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
            root: 'rounded-3xl bg-neutral-100 border border-accented border-dotted divide-y divide-dashed shadow-sm backdrop-blur supports-backdrop-filter:bg-default/40 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300',
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
            root: 'rounded-3xl bg-neutral-100 border border-accented border-dotted divide-y divide-dashed shadow-sm backdrop-blur supports-backdrop-filter:bg-default/40 hover:shadow-lg hover:-translate-y-0.6 transition-all duration-300'
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
