import { get, isEmpty } from 'lodash';
import { LocationDating } from './entities';
import { Place } from '@googlemaps/google-maps-services-js';

export function getPlaceName(content: string): string {
  let isStartMarkdown = true;
  let place = '';
  for (const c of content) {
    if (isStartMarkdown && isCharacter(c)) {
      isStartMarkdown = false;
    }
    if (!isStartMarkdown && c != '*') {
      place += c;
    }
    if (!isStartMarkdown && c == '*') {
      break;
    }
  }
  return isEmpty(place) ? null : place.trim();
}

export function getAddress(content: string): string {
  let isStartMarkdown = true;
  let address = '';
  for (const c of content) {
    if (isStartMarkdown && c == '(') {
      isStartMarkdown = false;
      continue;
    }
    if (!isStartMarkdown && c == ')') {
      return address;
    }
    if (!isStartMarkdown && c != ')') {
      address += c;
    }
  }
  return isEmpty(address) ? null : address.trim();
}

export function isCharacter(content: string): boolean {
  return content.replace(/[^\s\p{L}]/gu, '').trim() ? true : false;
}

export function mappingPlaceDetail(place: Place, location: LocationDating): void {
  location.address = get(place, 'formatted_address', null);
  location.phoneNumber = get(place, 'international_phone_number', null);
  location.name = get(place, 'name', null);
  location.rating = get(place, 'rating', null);
  location.reviews = get(place, 'reviews', []);
  location.price_level = get(place, 'price_level', null);
  location.url = get(place, 'url', null);
  location.userRatingsTotal = get(place, 'user_ratings_total', null);
  location.website = get(place, 'website', null);
}
