import * as rxjs from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { mergeMap, catchError } from 'rxjs/operators';

const { interval, of } = rxjs;

const API_URL = 'https://ahj-rxjs-back-68p2.vercel.app/messages/unread/';

function showError(message) {
  console.error(message);
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  errorElement.style.color = 'red';
  errorElement.style.padding = '10px';
  errorElement.style.margin = '10px 0';
  errorElement.style.border = '1px solid red';
  
  const container = document.querySelector('.newsWidget') || document.body;
  container.prepend(errorElement);
  
  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}.${month}.${year}`;
}

function trimText(subject) {
  if (subject.length > 15) {
    return subject.substring(0, 12) + '...';
  }
  return subject;
}

const messageUpdates$ = interval(5000).pipe(
  mergeMap(() => 
    ajax.getJSON(API_URL).pipe(
      catchError(error => {
        showError('Error fetching messages. Retrying...');
        console.error('Error:', error);
        return of({ status: 'error', messages: [] });
      })
    )
  )
);

const messagesTable = document.querySelector('.messWidget');
if (!messagesTable) {
  showError('Container .newsWidget not found!');
} else {
  const subscription = messageUpdates$.subscribe({
    next: (response) => {
      if (response.status === 'ok' && response.messages?.length > 0) {
        response.messages.forEach(message => {
          if (!document.querySelector(`div[data-message-id="${message.id}"]`)) {
            const row = document.createElement('div');
            row.classList.add('messItem');
            row.dataset.messageId = message.id;
            
            const widgetEmail = document.createElement('div');
            widgetEmail.classList.add('messEmail');
            widgetEmail.textContent = message.from;
            
            const widgetSubject = document.createElement('div');
            widgetSubject.classList.add('messSubject');
            widgetSubject.textContent = trimText(message.subject);
            
            const newsDate = document.createElement('div');
            newsDate.classList.add('messDate'); 
            newsDate.textContent = formatTimestamp(message.received);
      
            row.appendChild(widgetEmail);
            row.appendChild(widgetSubject);
            row.appendChild(newsDate);
            
            messagesTable.insertBefore(row, messagesTable.firstChild);
          }
        });
      }
    },
    error: (err) => {
      showError('Critical error in message stream');
      console.error('Observer error:', err);
    }
  });
}