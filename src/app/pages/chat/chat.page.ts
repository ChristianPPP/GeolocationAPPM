import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonContent, LoadingController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChatService } from '../../services/chat.service';
import { FieldValue } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';


export interface User {
  uid: string;
  email: string;
}

export interface Message {
  createdAt: FieldValue;
  id: string;
  from: string;
  msg: string;
  fromName: string;
  myMsg: boolean;
}

const printCurrentPosition = async () => {
  const coordinates = await Geolocation.getCurrentPosition();

  console.log('Current position:', coordinates);
  return coordinates;
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  @ViewChild(IonContent) content: IonContent | any;

  messages: Message[] = [];
  newMsg: string = '';
  cedula: string = '';
  userss: User[] = [];
  profile: any = null;
  coordinates: any = '';

  constructor(private chatService: ChatService, private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController) {
    }


  async ngOnInit() {
    await this.chatService.getUsers().then((users) => {
      users.docs.forEach((usr) => {
        this.userss.push(usr.data() as User)
      })
    })
    console.log(this.coordinates)
    await this.chatService.getUserProfile().subscribe((data) => {
      this.profile = data;
    })
  }

  sendGeolocationData() {
    this.chatService.saveGeoData(this.cedula, this.profile?.img, this.coordinates?.latitude, this.coordinates?.longitude).then(() => {
      this.cedula = '';
    });
  }

  async getCurrentCoordinates() {
    this.coordinates = await (await printCurrentPosition()).coords
    console.log(JSON.stringify(this.coordinates))
    this.ngOnInit();
  }





  sendMessage() {
    this.chatService.addChatMessage(this.newMsg).then(() => {
      this.newMsg = '';
      this.content.scrollToBottom();
    });
  }

  signOut() {
    this.chatService.signOut().then(() => {
      this.router.navigateByUrl('/', { replaceUrl: true });
    });
  }


  async changeImage() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera, // Camera, Photos or Prompt!
    });

    if (image) {
      const loading = await this.loadingController.create();
      await loading.present();

      const result = await this.chatService.uploadImage(image);
      loading.dismiss();

      if (!result) {
        const alert = await this.alertController.create({
          header: 'Upload failed',
          message: 'There was a problem uploading your avatar.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }


}
