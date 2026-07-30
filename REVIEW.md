# Code Review

## Bugs

### Activity controller did not await asynchronous work

`GET /activity` and `POST /activity` treated service results as synchronous values. Once the service became asynchronous, responses would be sent with unresolved promises and errors would bypass the shared error handler. The controller now awaits the service methods and routes use `asyncHandler`.

### Missing request validation in Activity

Any request body, including arrays and arbitrary fields, was persisted. This allowed malformed records and made the API response shape unpredictable. `activityValidator` now validates and normalizes the supported `action` and optional `info` fields.

## Security

### No request-size limit is configured

`express.json()` uses its default limit, which may not fit the production threat model. Set an explicit small body limit appropriate to this API (for example, `express.json({ limit: '100kb' })`) and apply rate limiting at the edge.

## Code Quality

### The report status model was derived rather than explicit

Tasks initially supported only `completed`, so the report could not distinguish `todo` from `in-progress`. Tasks now accept a validated `status` field (`todo`, `in-progress`, or `done`) and keep the legacy `completed` field synchronized. Existing records without a status continue to be interpreted from `completed`.

That is the usual task-management model. A status represents the task’s current point in its workflow; “To Do → In Progress → Done” is the common baseline workflow.

Since it's a production level we must make sure making a change like this won't break the existing records for users.

### “Recent” must have an explicit business definition

The report defines recent activity as timestamps from the last seven days, excluding future or invalid timestamps. Make the reporting window configurable if product requirements differ.

### Temporary-file IDs duplicated UUID generation

`jsonStore` originally generated UUIDs independently for its temporary filenames even though the project already provides `createId` in `src/utils/id.js`. Duplicated utility logic can diverge over time. The JSON store now reuses the shared helper.

### Activity naming was unclear and not consistent

Names such as `get_activity`, `aSvc`, and `loadDataA` obscured intent. The refactor uses descriptive names and preserves Activity's original raw response shape for compatibility. A future API version could standardize response envelopes across resources.

## Maintainability

### Tasks validation was duplicated and inconsistent

The controller had ad-hoc validation while the dedicated `taskValidator` was unused. Error messages and accepted fields could drift. Controllers now use the dedicated validator as the single input-validation boundary.

### Path resolution depended on the launch directory

Both modules located data using `process.cwd()`. Running the server from a different directory would target the wrong files. Both services now resolve their JSON files from the module location.

### Duplicate Activity data loaders

`loadDataA` and `loadDataB` had identical behavior, creating needless divergence risk. The replacement service has one shared storage abstraction and clear operation names.

## Security

### JSON file writes were not coordinated or atomic

Concurrent mutating requests can each read the same array and overwrite another request's update; an interrupted write can also leave invalid JSON. Updates are now serialized per file, and writes use a temporary file followed by a rename.

## Performance

### Activity used blocking filesystem APIs

Synchronous reads and writes block Node.js's event loop, delaying every request while JSON files are accessed. The activity service now uses the shared promise-based JSON store.
