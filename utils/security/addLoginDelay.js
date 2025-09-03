export const addLoginDelay = () => {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * 400) + 100;
    setTimeout(resolve, delay);
  });
};
