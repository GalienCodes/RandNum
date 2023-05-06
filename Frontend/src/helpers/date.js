export const isToday = activeDate => {
  try {
    return !!(
      activeDate.getDate() === new Date().getDate() &&
      activeDate.getMonth() === new Date().getMonth()
    );
  } catch (e) {
    return false;
  }
};
