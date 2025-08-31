export function makeIdentifyMessage(workspaceId: string) {
  return JSON.stringify({ type: 'identify', workspaceId });
}

export function isFlagUpdatedMessage(raw: string) {
  try {
    const obj = JSON.parse(raw);
    return obj && obj.type === 'flag_updated';
  } catch (e) { return false; }
}
