# HX Attribute Documentation

## HTTP Methods

### `HX.GET` - `'hx-get'`

Specifies the endpoint URL for HTTP GET requests. When an element with this attribute is triggered (clicked for buttons/links, changed for selects), it performs a GET request to the specified URL.

**Usage:**

```html
<button hx-get="/api/data">Load Data</button>
<a hx-get="/page">Navigate</a>
<select hx-get="/filter">...</select>
```

---

### `HX.POST` - `'hx-post'`

Specifies the endpoint URL for HTTP POST requests. Similar to `HX.GET`, but sends form data in the request body. Automatically validates required fields before submission.

**Usage:**

```html
<button hx-post="/api/save">Save</button>
<button hx-post="/submit">Submit Form</button>
```

---

### `HX.UPLOAD` - `'hx-upload'`

Specifies the endpoint URL for file upload requests. Creates a file input dialog when triggered and sends the selected file via POST with multipart/form-data encoding. Dispatches `file-upload-progress` custom events during upload.

**Usage:**

```html
<button hx-upload="/api/upload">Upload File</button>
```

**Events:**

- `file-upload-progress` - Fired during upload with `event.detail` containing percentage complete

---

## Element Control

### `HX.ENABLE` - `'hx-enable'`

Comma-separated list of element selectors to enable when the AJAX request is initiated. Used to enable form controls that should become active during or after a request.

**Usage:**

```html
<button hx-post="/save" hx-enable="#submitBtn,#cancelBtn">Save</button>
```

---

### `HX.DISABLE` - `'hx-disable'`

Comma-separated list of element selectors to disable when the AJAX request is initiated. Useful for preventing interactions with certain controls during request processing.

**Usage:**

```html
<button hx-post="/process" hx-disable="#editBtn,#deleteBtn">Process</button>
```

---

### `HX.SWAP` - `'hx-swap'`

Comma-separated list of element selectors whose content will be replaced with the response HTML. The server response must contain HTML fragments with matching `id` attributes, separated by pipe characters (`|`).

**Usage:**

```html
<button hx-get="/refresh" hx-swap="#content,#sidebar">Refresh</button>
```

**Server Response Format:**

```html
<div id="content">New content</div>|<div id="sidebar">New sidebar</div>
```

---

### `HX.SEND` - `'hx-send'`

Comma-separated list of element selectors whose values should be included in the POST request body, even if they're not inside a form. Supports INPUT, TEXTAREA, SELECT elements (uses `.value`) and other elements (uses `.innerText` or `.textContent`).

**Usage:**

```html
<button hx-post="/api/save" hx-send="#name,#email,#notes">Save</button>
<input id="name" type="text" value="John">
<input id="email" type="email" value="john@example.com">
<div id="notes">Additional notes</div>
```

---

### `HX.REDIRECT` - `'hx-redirect'`

URL to redirect to after a successful AJAX request (HTTP status 200-299). When specified, the browser navigates to this URL instead of swapping content.

**Usage:**

```html
<button hx-post="/login" hx-redirect="/dashboard">Login</button>
```

---

## Validation

### `HX.REQUIRE` - `'hx-require'`

Comma-separated list of element selectors that must have values before the request is sent. Shows a popover error message for empty required fields and prevents submission.

**Usage:**

```html
<button hx-post="/save" hx-require="#username,#password">Save</button>
<input id="username" type="text">
<input id="password" type="password">
```

**Error Message:** "This field is required."

---

### `HX.MIN` - `'hx-min'`

Minimum character length validation for input fields. Shows a popover when the value is shorter than specified. Works with `HX.VDISABLE` to control button states.

**Usage:**

```html
<input id="username" hx-min="3" hx-vdisable="#submitBtn">
<button id="submitBtn">Submit</button>
```

**Error Message:** "{ElementName}: Minimum length is {N} characters."

---

### `HX.MAX` - `'hx-max'`

Maximum character length validation for input fields. Shows a popover when the value exceeds the specified length. Works with `HX.VDISABLE` to control button states.

**Usage:**

```html
<input id="username" hx-max="20" hx-vdisable="#submitBtn">
<button id="submitBtn">Submit</button>
```

**Error Message:** "{ElementName}: Maximum length is {N} characters."

---

### `HX.VDISABLE` - `'hx-vdisable'`

Element selector for a button/control that should be disabled when the input validation fails (min/max length). The target element is automatically enabled when validation passes.

**Usage:**

```html
<input id="password" hx-min="8" hx-max="32" hx-vdisable="#submitBtn">
<button id="submitBtn">Submit</button>
```

---

### `HX.PDISABLE` - `'hx-pdisable'`

Password matching validation. Value format: `#password1,#password2,#submitButton`. Validates that both password fields match and meet length requirements, controlling the submit button state. Shows "Passwords must match" popover on mismatch.

**Usage:**

```html
<input id="pw1" type="password" hx-min="8" hx-pdisable="#pw1,#pw2,#submitBtn">
<input id="pw2" type="password" hx-min="8" hx-pdisable="#pw1,#pw2,#submitBtn">
<button id="submitBtn">Submit</button>
```

**Validation Logic:**

- Both passwords must meet min/max length requirements
- Both passwords must match exactly
- Both fields must have values
- Submit button is disabled until all conditions are met

**Error Message:** "Passwords must match"

---

## Visibility/Display

### `HX.SHOW` - `'hx-show'`

Shows target elements when triggered. Supports timed auto-hide and CSS transition classes. Format: `selector:duration:cssClass` where duration is in milliseconds and cssClass is optional.

**Usage:**

```html
<button hx-show="#notification">Show Notification</button>
<button hx-show="#alert:3000">Show Alert (3 seconds)</button>
<button hx-show="#modal:5000:fade-in">Show Modal with Animation</button>
<div id="notification" style="display:none;">Success!</div>
```

**Format:**

- `#selector` - Show permanently
- `#selector:3000` - Show for 3 seconds then hide
- `#selector:3000:fade-in` - Show for 3 seconds with CSS class, then hide and remove class

---

### `HX.HIDE` - `'hx-hide'`

Hides target elements when triggered. Removes optional CSS transition classes. Format same as `HX.SHOW`.

**Usage:**

```html
<button hx-hide="#modal">Close Modal</button>
<button hx-hide="#notification:0:fade-out">Hide with Animation</button>
```

---

### `HX.SHOW_ONLOAD` - `'hx-show-onload'`

Automatically shows elements when the page loads. Same format and behavior as `HX.SHOW`, but triggered on `DOMContentLoaded` event instead of user interaction.

**Usage:**

```html
<div id="welcome" hx-show-onload="#welcome:5000:slide-in" style="display:none;">
    Welcome message
</div>
```

**Use Cases:**

- Welcome messages
- Temporary notifications
- Splash screens
- Tutorial overlays

---

## Event Handlers

### `HX.ONCHANGE_ENABLE` - `'hx-onchange-enable'`

Comma-separated list of element selectors whose disabled state should mirror the disabled state of the triggering element. When the element with this attribute is enabled/disabled, all target elements are also enabled/disabled.

**Usage:**

```html
<input type="checkbox" id="agree" hx-onchange-enable="#submitBtn,#nextBtn">
<button id="submitBtn" disabled>Submit</button>
<button id="nextBtn" disabled>Next</button>
```

**Behavior:**

- When checkbox is checked → target buttons become enabled
- When checkbox is unchecked → target buttons become disabled
- Syncs the disabled state bidirectionally

---

## Notes

### Combining Attributes

Multiple attributes can be used together on the same element:

```html
<button 
    hx-post="/api/save" 
    hx-require="#name,#email" 
    hx-send="#name,#email,#notes"
    hx-swap="#result"
    hx-disable="#editBtn"
    hx-redirect="/success">
    Save and Redirect
</button>
```

### Server Response Format

For `HX.SWAP`, the server must return pipe-separated HTML fragments:

```html
<div id="content">Updated content</div>|<div id="status">Success</div>
```

### Error Handling

HTTP status codes in `ERROR_STATUS_CODES` array (400, 401, 403, 404, 500) display error alerts with the response text.

### Loading Indicator

All AJAX requests automatically show a loading indicator after 100ms delay (configurable via `CONFIG.MS_LOADING_INDICATOR_DELAY`).

### Button Disable Protection

Trigger buttons are automatically disabled for 500ms (configurable via `CONFIG.MS_DISABLE_TRIGGER_BUTTON`) to prevent double-submission.