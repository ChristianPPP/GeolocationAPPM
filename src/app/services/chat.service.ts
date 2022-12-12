import { Injectable } from '@angular/core';
import { FieldValue, collection, serverTimestamp } from '@angular/fire/firestore';

import {
  getDownloadURL,
  ref,
  getStorage,
  uploadString,
} from '@angular/fire/storage';
import { Photo } from '@capacitor/camera';

import {
  doc,
  Firestore,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  docData, updateDoc, getDoc
} from '@angular/fire/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';



export interface User {
  uid: string;
  email: string;
}

export interface TimeC {
  ct: FieldValue;
}

export interface Message {
  createdAt: FieldValue;
  id: string;
  from: string;
  msg: string;
  fromName: string;
  myMsg: boolean;
}

export interface Response {
  id: string;
  fromName: string;
  myMsg: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  currentUser: User | any;
  messages: Message[] = [];
  response: Response[] = [];
  storage = getStorage();
  act: TimeC | any = <TimeC>({
    ct: serverTimestamp()
  });

  constructor(private afAuth: Auth, private afs: Firestore) {
    this.afAuth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });
  }

  getUserProfile() {
    this.afAuth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });
    const userDocRef = doc(this.afs, 'geolocation', this.currentUser.uid);
    return docData(userDocRef);
  }

  saveGeoData(cedula: string, img: string, latitud: number, longitud: number) {
    if (img === undefined) {
      img = '';
    }
    if (latitud === undefined) {
      latitud = 0;
    }
    if (longitud === undefined) {
      longitud = 0;
    }
    return setDoc(doc(this.afs, 'geolocation', this.currentUser.uid), {
      cedula: cedula,
      img: img,
      latitud: latitud,
      longitud: longitud,
      createdAt: serverTimestamp(),
    });
  }

  async signup({ email, password } : { email: any, password: any}): Promise<any> {
    const credential = await createUserWithEmailAndPassword(this.afAuth,
      email,
      password
    );

    const user = credential.user;
    const userDocRef = doc(this.afs, `users/${user.uid}`);

    return setDoc(userDocRef, {
      uid: `${user.uid}`,
      email: user.email,
    });
  }

  signIn({ email, password } : { email: any, password: any}) {
    return signInWithEmailAndPassword(this.afAuth, email, password);
  }

  signOut(): Promise<void> {
    return signOut(this.afAuth);
  }

  addChatMessage(msg: string) {
    return addDoc(collection(this.afs, 'messages'), {
      msg: msg,
      from: this.currentUser.uid,
      createdAt: serverTimestamp(),
    });
  }



  async getChatMessages(users: User[]) {
    const qy = query(collection(this.afs, 'messages'), orderBy('createdAt'))
    await getDocs(qy).then((msgs) => {
      msgs.docs.forEach((msg) => {
        this.messages.push(msg.data() as Message)
      });
      this.messages.map((msg) => {
        msg.fromName = this.getUserForMsg(msg.from, users)
        msg.myMsg = this.currentUser.uid == msg.from;
        msg.createdAt
      });
    })
    return this.messages
  }

  getUsers() {
    const qy = query(collection(this.afs, 'users'))
    return getDocs(qy);
  }


  private getUserForMsg(msgFromId: string, users: User[]): string {
    for (let usr of users) {
      if (usr.uid == msgFromId) {
        return usr.email;
      }
    }
    return 'Deleted';
  }

  async uploadImage(cameraFile: Photo | any) {
    const user = this.currentUser;
    const path = `geo/${user.uid}/file.png`;
    const storageRef = ref(this.storage, path);
    const geolocationRef = collection(this.afs, "geolocation");
    const docRef = doc(this.afs, 'geolocation', this.currentUser.uid);

    try {
      await uploadString(storageRef, cameraFile.base64String, 'base64');

      const imageUrl = await getDownloadURL(storageRef);

      setDoc(docRef, {
        img: imageUrl
      })

      return true;
    } catch (e) {
      return null;
    }
  }


}
