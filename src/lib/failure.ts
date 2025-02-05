export function isFailure(obj: unknown): obj is ScriptFailure {
	return !!obj && (obj as ScriptFailure).ok === false;
}

export const throwFailure = <T>(obj: ScriptFailure | T) => {
	if (isFailure(obj)) throw obj.msg;
	return obj;
};
