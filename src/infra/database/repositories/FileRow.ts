// mirrors table
// ugly is fine
// zero behaviour
// another advantage is, there is no DB leak. 
// Yes, filerow will have _id, but if the domain code doesnot use it, it has no way of reaching the client.

export type FileRow = {
  _id: string;
  ddocId: string;
  title: string;
  content: string;
  portalAddress: string;
  localVersion: number;
  onchainVersion: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  isDeleted: 0 | 1;
  createdAt: string;
  updatedAt: string;
};