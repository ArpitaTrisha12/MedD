
import appointment_img from './appointment_img.png'
import header_img from './header_img.png'
import group_profiles from './group_profiles.png'
import profile_pic from './profile_pic.jpeg'
import contact_image from './contact_image.png'
import about_image from './about_image.png'
import logo from './logo.jpeg'

import dropdown_icon from './dropdown_icon.svg'
import menu_icon from './menu_icon.svg'
import cross_icon from './cross_icon.png'
import chats_icon from './chats_icon.svg'
import verified_icon from './verified_icon.svg'
import arrow_icon from './arrow_icon.svg'
import info_icon from './info_icon.svg'
import upload_icon from './upload_icon.png'
import stripe_logo from './stripe_logo.png'
import razorpay_logo from './razorpay_logo.png'

import doc1 from './doc1.png'
import doc2 from './doc2.png'
import doc3 from './doc3.png'
import doc4 from './doc4.png'
import doc5 from './doc5.png'
import doc6 from './doc6.png'
import doc7 from './doc7.png'
import doc8 from './doc8.png'
import doc9 from './doc9.png'
import doc10 from './doc10.png'
import doc11 from './doc11.png'
import doc12 from './doc12.png'
import doc13 from './doc13.png'
import doc14 from './doc14.png'
import doc15 from './doc15.png'

// Speciality PNG Images
import Dermatologist from './Dermatologist.png'
import Gastroenterologist from './Gastroenterologist.png'
import General_physician from './General_physician.png'
import Gynecologist from './Gynecologist.png'
import Neurologist from './Neurologist.png'
import Pediatricians from './Pediatricians.png'

// All Assets
export const assets = {
  appointment_img,
  header_img,
  group_profiles,
  logo,
  chats_icon,
  verified_icon,
  info_icon,
  profile_pic,
  arrow_icon,
  contact_image,
  about_image,
  menu_icon,
  cross_icon,
  dropdown_icon,
  upload_icon,
  stripe_logo,
  razorpay_logo
}

// Speciality Data
export const specialityData = [
  {
    speciality: 'General physician',
    image: General_physician
  },
  {
    speciality: 'Gynecologist',
    image: Gynecologist
  },
  {
    speciality: 'Dermatologist',
    image: Dermatologist
  },
  {
    speciality: 'Pediatricians',
    image: Pediatricians
  },
  {
    speciality: 'Neurologist',
    image: Neurologist
  },
  {
    speciality: 'Gastroenterologist',
    image: Gastroenterologist
  }
]

// Doctor Data
export const doctors = [
  {
    _id: 'doc1',
    name: 'Dr. Md. Rahim Uddin',
    image: doc1,
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    division: 'Dhaka',
    about: 'Dr. Rahim Uddin is dedicated to providing quality medical care, focusing on preventive medicine, early diagnosis, and effective treatment.',
    fees: 50,
    address: {
      line1: 'Dhanmondi',
      line2: 'Dhaka, Bangladesh'
    }
  },
  {
    _id: 'doc2',
    name: 'Dr. Nusrat Jahan',
    image: doc2,
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    division: 'Sylhet',
    about: 'Dr. Nusrat Jahan is committed to providing compassionate healthcare for women, focusing on reproductive health and maternal care.',
    fees: 60,
    address: {
      line1: 'Zindabazar',
      line2: 'Sylhet, Bangladesh'
    }
  },
  {
    _id: 'doc3',
    name: 'Dr. Farhan Ahmed',
    image: doc3,
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Years',
    division: 'Chattogram',
    about: 'Dr. Farhan Ahmed focuses on skin health, proper diagnosis, and personalized dermatological treatment.',
    fees: 30,
    address: {
      line1: 'GEC Circle',
      line2: 'Chattogram, Bangladesh'
    }
  },
  {
    _id: 'doc4',
    name: 'Dr. Mohammad Hasan',
    image: doc4,
    speciality: 'Pediatricians',
    degree: 'MBBS',
    experience: '2 Years',
    division: 'Rajshahi',
    about: 'Dr. Mohammad Hasan is passionate about child healthcare, growth monitoring, disease prevention, and pediatric treatment.',
    fees: 40,
    address: {
      line1: 'Shaheb Bazar',
      line2: 'Rajshahi, Bangladesh'
    }
  },
  {
    _id: 'doc5',
    name: 'Dr. Sadia Islam',
    image: doc5,
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    division: 'Khulna',
    about: 'Dr. Sadia Islam is dedicated to neurological healthcare, focusing on accurate diagnosis and effective treatment.',
    fees: 50,
    address: {
      line1: 'Sonadanga',
      line2: 'Khulna, Bangladesh'
    }
  },
  {
    _id: 'doc6',
    name: 'Dr. Arif Hossain',
    image: doc6,
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    division: 'Barishal',
    about: 'Dr. Arif Hossain provides patient-focused neurological care with an emphasis on diagnosis and treatment.',
    fees: 50,
    address: {
      line1: 'Nathullabad',
      line2: 'Barishal, Bangladesh'
    }
  },
  {
    _id: 'doc7',
    name: 'Dr. Tanvir Ahmed',
    image: doc7,
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    division: 'Rangpur',
    about: 'Dr. Tanvir Ahmed is committed to delivering comprehensive healthcare, preventive care, and effective treatment.',
    fees: 50,
    address: {
      line1: 'Jahaj Company Mor',
      line2: 'Rangpur, Bangladesh'
    }
  },
  {
    _id: 'doc8',
    name: 'Dr. Mahjabin Chowdhury',
    image: doc8,
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    division: 'Mymensingh',
    about: 'Dr. Mahjabin Chowdhury focuses on women’s health, maternal care, and reproductive healthcare.',
    fees: 60,
    address: {
      line1: 'Ganginarpar',
      line2: 'Mymensingh, Bangladesh'
    }
  },
  {
    _id: 'doc9',
    name: 'Dr. Samia Rahman',
    image: doc9,
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Years',
    division: 'Dhaka',
    about: 'Dr. Samia Rahman is dedicated to providing quality skin care and personalized dermatological treatment.',
    fees: 30,
    address: {
      line1: 'Uttara',
      line2: 'Dhaka, Bangladesh'
    }
  },
  {
    _id: 'doc10',
    name: 'Dr. Imran Kabir',
    image: doc10,
    speciality: 'Pediatricians',
    degree: 'MBBS',
    experience: '2 Years',
    division: 'Sylhet',
    about: 'Dr. Imran Kabir is focused on child health, pediatric diagnosis, and providing quality healthcare for children.',
    fees: 40,
    address: {
      line1: 'Ambarkhana',
      line2: 'Sylhet, Bangladesh'
    }
  },
  {
    _id: 'doc11',
    name: 'Dr. Ayesha Siddika',
    image: doc11,
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    division: 'Chattogram',
    about: 'Dr. Ayesha Siddika focuses on neurological care, early diagnosis, and patient-centered treatment.',
    fees: 50,
    address: {
      line1: 'Panchlaish',
      line2: 'Chattogram, Bangladesh'
    }
  },
  {
    _id: 'doc12',
    name: 'Dr. Mahmudul Hasan',
    image: doc12,
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    division: 'Rajshahi',
    about: 'Dr. Mahmudul Hasan is committed to providing comprehensive neurological care and effective treatment.',
    fees: 50,
    address: {
      line1: 'Laxmipur',
      line2: 'Rajshahi, Bangladesh'
    }
  },
  {
    _id: 'doc13',
    name: 'Dr. Sharmin Akter',
    image: doc13,
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    division: 'Khulna',
    about: 'Dr. Sharmin Akter is dedicated to preventive healthcare, early diagnosis, and comprehensive medical services.',
    fees: 50,
    address: {
      line1: 'Khalishpur',
      line2: 'Khulna, Bangladesh'
    }
  },
  {
    _id: 'doc14',
    name: 'Dr. Saiful Islam',
    image: doc14,
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    division: 'Barishal',
    about: 'Dr. Saiful Islam is committed to providing quality healthcare with a focus on women’s health and maternal care.',
    fees: 60,
    address: {
      line1: 'Sadar Road',
      line2: 'Barishal, Bangladesh'
    }
  },
  {
    _id: 'doc15',
    name: 'Dr. Tanjila Sultana',
    image: doc15,
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Years',
    division: 'Rangpur',
    about: 'Dr. Tanjila Sultana focuses on skin health, dermatological diagnosis, and personalized patient care.',
    fees: 30,
    address: {
      line1: 'Modern Mor',
      line2: 'Rangpur, Bangladesh'
    }
  }
]
