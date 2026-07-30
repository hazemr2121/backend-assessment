# Code Review

## Security

### No request-size limit is configured

`express.json()` uses its default limit, which may not fit the production threat model. Set an explicit small body limit appropriate to this API (for example, `express.json({ limit: '100kb' })`) and apply rate limiting at the edge.

## Code Quality

### The report status model was derived rather than explicit

Tasks initially supported only `completed`, so the report could not distinguish `todo` from `in-progress`. Tasks now accept a validated `status` field (`todo`, `in-progress`, or `done`) and keep the legacy `completed` field synchronized. Existing records without a status continue to be interpreted from `completed`.

That is the usual task-management model. A status represents the task’s current point in its workflow; “To Do → In Progress → Done” is the common baseline workflow.

Since it's a production level we must make sure making a change like this won't break the existing records for users.

## Maintainability

### Tasks validation was duplicated and inconsistent

The controller had ad-hoc validation while the dedicated `taskValidator` was unused. Error messages and accepted fields could drift. Controllers now use the dedicated validator as the single input-validation boundary.

### Path resolution depended on the launch directory

Both modules located data using `process.cwd()`. Running the server from a different directory would target the wrong files. Both services now resolve their JSON files from the module location.

## Security

### JSON file writes were not coordinated or atomic

Concurrent mutating requests can each read the same array and overwrite another request's update; an interrupted write can also leave invalid JSON. Updates are now serialized per file, and writes use a temporary file followed by a rename.
