const users: Array<{ id: number; name: string; room: number }> = [];

const addUser = (id: number, name: string, room: number) => {
  const existingUser = users.find(
    (user) => user.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (existingUser) return { error: 'Username has already been taken' };
  if (!name && !room) return { error: 'Username and room are required' };
  if (!name) return { error: 'Username is required' };
  if (!room) return { error: 'Room is required' };
  const user = { id, name, room };
  users.push(user);
  return { user };
};

const getUser = (id: number) => {
  let user = users.find((user) => user.id == id);
  return user;
};

const deleteUser = (id: number) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

const getUsersInRoom = (room: number) =>
  users
    .filter((user) => user.room === room)
    .reverse()
    .filter((user, index) => index < 2);

export { addUser, getUser, deleteUser, getUsersInRoom };
