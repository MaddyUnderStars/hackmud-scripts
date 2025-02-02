export function isFailure(obj: object): obj is ScriptFailure {
	return !!obj && (obj as ScriptFailure).ok === false;
}
