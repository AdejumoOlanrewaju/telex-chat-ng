import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hoursAgo'
})
export class HoursAgoPipe implements PipeTransform {

  transform(value: any): any {

    if (!value) return '';

    const lastChanged = new Date(+value).getTime(); // force to number
    const now = Date.now();
    const diffInMs = now - lastChanged;

    if (diffInMs < 0) return 'In the future';

    const seconds = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    } else if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }
}
