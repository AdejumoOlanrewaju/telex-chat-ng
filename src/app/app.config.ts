import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "chat-app-8ae69", appId: "1:985482572381:web:b107081ecb7eb9568ed3b4", storageBucket: "chat-app-8ae69.firebasestorage.app", apiKey: "AIzaSyBNy-Dim9Dj-5iWLr3-ISE7wy8AO_uBDmQ", authDomain: "chat-app-8ae69.firebaseapp.com", messagingSenderId: "985482572381", measurementId: "G-H98J5C8LGL" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
