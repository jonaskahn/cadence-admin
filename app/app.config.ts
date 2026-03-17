export default defineAppConfig({
  ui: {
    colors: {
      primary: 'orange',
      neutral: 'stone'
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
