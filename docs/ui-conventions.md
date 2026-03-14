# UI Conventions

## Action Labels and Confirmations

Primary action buttons for Save, Update, and Delete must follow these conventions:

### Labels

- **Save**: Use `t('common.save')` for saving forms, settings, or defaults.
- **Update**: Use `t('common.update')` when the user is explicitly updating an existing entity.
- **Delete**: Use `t('common.delete')` for delete actions.

Avoid variants like "Save Changes", "Save Defaults", or "Save Profile" on buttons. Use the standardized labels above.

### Confirmation Popovers

For impactful changes (org settings, orchestrators, users, LLM configs, plugins, central points), use the `ConfirmActionPopover` component so that pressing the action button opens a confirmation popover with friendly copy (e.g. "Let's save it") and Cancel/Confirm options.

### ConfirmActionPopover Usage

The popover uses a three-row layout for clarity:

1. **Title** (`confirm-title-key`): Short, clear action name (e.g. "Save", "Update", "Delete").
2. **Description** (`confirm-message-key`): Clear explanation of what the action does.
3. **Action**: Cancel and confirm buttons. Confirm button uses `confirm-label-key` (e.g. "Let's save it").

```vue
<ConfirmActionPopover
  label-key="common.save"
  icon="i-lucide-save"
  confirm-title-key="common.saveConfirmTitle"
  confirm-message-key="common.saveConfirmMessage"
  confirm-label-key="common.saveConfirmFriendly"
  :loading="saving"
  :on-confirm="save"
/>
```

For form submit triggers:

```vue
<ConfirmActionPopover
  label-key="common.save"
  confirm-title-key="common.saveConfirmTitle"
  confirm-message-key="common.saveConfirmMessage"
  confirm-label-key="common.saveConfirmFriendly"
  :loading="saving"
  :on-confirm="() => formRef?.$el?.requestSubmit?.()"
/>
```

### i18n Keys

**Title (distinct from button label):**

- `common.saveConfirmTitle`: "Save changes"
- `common.updateConfirmTitle`: "Update changes"
- `common.deleteConfirmTitle`: "Confirm delete"
- `common.addConfirmTitle`: "Confirm add"

**Description (explanation, no duplication of title):**

- `common.saveConfirmMessage`: "Your changes will be applied immediately."
- `common.updateConfirmMessage`: "Changes will take effect."
- `common.deleteConfirmMessage`: "This cannot be undone."

**Confirm button (friendly label):**

- `common.saveConfirmFriendly`: "Let's save it"
- `common.updateConfirmFriendly`: "Let's update it now"
- `common.deleteConfirmFriendly`: "Let's delete it"

Use entity-specific keys for title and description (e.g. `settings.saveOrchestratorDefaultsTitle`, `settings.saveOrchestratorDefaultsMessage`) when needed.

## InfoPopover (Contextual Help)

`InfoPopover` is the standard way to surface inline contextual help. Users click the info icon to see a popover with title and description, enabling self-discovery without guided tours.

### Usage

- Use `title-key` and `description-key` pointing to `info.*` i18n keys.
- **Page-level**: Place in `UDashboardNavbar` `#right` slot or `UPageCard` `#header` slot alongside the title.
- **Field-level**: Place in `UFormField` `#label` slot alongside the label text.

Wrap label and InfoPopover in a flex container for alignment:

```vue
<template #label>
  <div class="flex items-center gap-2">
    <span>{{ t('settings.displayName') }}</span>
    <InfoPopover title-key="info.fields.displayName.title" description-key="info.fields.displayName.description" />
  </div>
</template>
```

### i18n Structure

Add keys under the `info` namespace in `en-us.json`, `vi-VN.json`, and `de.json`:

- `info.pages.*` — page-level descriptions (dashboard, chat, orchestrators, plugins, profile)
- `info.settings.*` — settings section descriptions (orgIdentity, orgProfile, members, llmConfigs, orchestrators, centralPoints)
- `info.admin.*` — admin section descriptions (orgs, users, systemPlugins, globalSettings, pool, health)
- `info.fields.*` — field-level descriptions for complex forms

### Markdown Support

Descriptions are rendered as **markdown** via MDC. Use:

- `**bold**` for emphasis
- `-` bullet lists
- `1.` numbered lists
- `` `code` `` for identifiers

Write detailed, feature-specific content: what it does, how to use it, and any important notes. Avoid generic one-liners.
