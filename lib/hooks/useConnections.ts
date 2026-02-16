import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConnectionConfig } from '@/lib/api';

export interface SavedConnection extends ConnectionConfig {
  id: string;
  name: string;
  createdAt: Date;
}

export function useConnections(userId: string | null) {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setConnections([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'connections'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as SavedConnection[];

      setConnections(conns);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const saveConnection = async (name: string, config: ConnectionConfig) => {
    if (!userId) return;

    await addDoc(collection(db, 'connections'), {
      userId,
      name,
      ...config,
      password: '', // Don't save passwords in Firebase
      createdAt: new Date(),
    });
  };

  const deleteConnection = async (connectionId: string) => {
    await deleteDoc(doc(db, 'connections', connectionId));
  };

  return { connections, loading, saveConnection, deleteConnection };
}
