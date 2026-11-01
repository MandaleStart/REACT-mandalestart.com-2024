export function countUpcomingServiceExpiries(priorityItems) {
  if (!Array.isArray(priorityItems)) return 0;
  return priorityItems.filter(
    (item) => item?.kind === 'service-expiry' && item.diffDays >= 0 && item.diffDays <= 30,
  ).length;
}

export function countUsersWithoutClientProfile(users) {
  if (!Array.isArray(users)) return 0;
  return users.filter((user) => !user.isAdmin && !user.clientId).length;
}
