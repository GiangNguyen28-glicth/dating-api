use admin
db.createUser({
  user: 'giangnt',
  pwd: 'giangnt',
  roles: [
    {
      role: 'dbOwner',
      db: 'dating',
    },
  ],
});
