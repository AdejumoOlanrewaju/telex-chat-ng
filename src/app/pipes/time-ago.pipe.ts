import { Pipe, PipeTransform } from '@angular/core';
import {format, formatDistanceToNow} from 'date-fns'
@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {

   transform(value: any, timeFormat: string = 'p'): string {
    if (!value?.seconds) return '';
    const date = new Date(value.seconds * 1000);
    return format(date, timeFormat); // default = 'p' = 3:45 PM
  }

}
