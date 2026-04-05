import { Document } from "mongoose";

interface IExhibition extends Document {
   title: string;
   images: string[];
   location: string;
   date: string;
   url: string;
   metadata: any;
}


export type { IExhibition };
