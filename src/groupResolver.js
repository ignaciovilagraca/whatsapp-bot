async function resolveGroupByInviteCode(sock, inviteCode) {
  const groupInfo = await sock.groupGetInviteInfo(inviteCode);

  if (!groupInfo || !groupInfo.id) {
    throw new Error(
      `Could not resolve group from invite code "${inviteCode}"`
    );
  }

  return { id: groupInfo.id, subject: groupInfo.subject };
}

module.exports = { resolveGroupByInviteCode };
