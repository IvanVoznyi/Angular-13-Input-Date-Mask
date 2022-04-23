import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { filter, fromEvent, map } from 'rxjs';

const enum InputType {
  DeleteContentBackward = 'deleteContentBackward',
  DeleteContentForward = 'deleteContentForward',
  InsertText = 'insertText',
}

interface InputData {
  type: string;
  value: string;
  start: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('mask') mask: ElementRef<HTMLInputElement> | null = null;

  ngAfterViewInit(): void {
    if (this.mask) {
      const mask = '__/__/____';
      this.mask.nativeElement.value = mask;

      const insertTest = (
        value: Array<string>,
        input: InputData,
        index: number
      ) => {
        if (['/'].includes(mask[index])) {
          value.push(mask[index]);
        } else {
          if (index <= input.start) {
            value.push(input.value[index]);
          }

          if (index > input.start) {
            value.push(input.value[index + 1]);
          }

          if (value[input.start + 1] === '/') {
            input.start += 1;
          }
        }
      };

      const skipMaskSymbol = (value: Array<string>, input: InputData) => {
        if (value[input.start] === '/') {
          input.start -= 1;
        }
      };

      const deleteContentBackward = (
        value: Array<string>,
        input: InputData,
        index: number
      ) => {
        if (index <= input.start) {
          value.push(input.value[index]);
        }

        if (input.start + 1 === index) {
          value.push(mask[index]);
          skipMaskSymbol(value, input);
        }

        if (index > input.start) {
          value.push(input.value[index]);
          skipMaskSymbol(value, input);
        }
      };

      const inputEvent = {
        [InputType.InsertText]: (
          value: Array<string>,
          input: InputData,
          index: number
        ) => insertTest(value, input, index),
        [InputType.DeleteContentBackward]: (
          value: Array<string>,
          input: InputData,
          index: number
        ) => deleteContentBackward(value, input, index),
        [InputType.DeleteContentForward]: () => {},
      };

      fromEvent(this.mask.nativeElement, 'input')
        .pipe(
          map((input) => {
            const target = input.target as HTMLInputElement;

            return {
              type: (input as InputEvent).inputType as InputType,
              value: target.value,
              start: (target.selectionStart ?? 0) - 1,
            };
          }),
          map((input) => {
            let value: Array<string> = [];

            for (let i = 0; i < mask.length; i++) {
              inputEvent[input.type](value, input, i);
            }

            this.mask!.nativeElement.value = value.join('');
            this.mask!.nativeElement.selectionEnd = input.start + 1;

            return value.join('');
          }),
          filter((value) => /\d{2}\/\d{2}\/\d{4}/.test(value))
        )
        .subscribe((res) => {
          console.log(res);
        });
    }
  }
}
