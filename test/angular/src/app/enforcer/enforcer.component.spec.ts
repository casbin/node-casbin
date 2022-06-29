import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EnforcerComponent } from './enforcer.component';

describe('EnforcerComponent', () => {
  let component: EnforcerComponent;
  let fixture: ComponentFixture<EnforcerComponent>;

  it('should enforce request correctly', () => {
    const fixture = TestBed.createComponent(EnforcerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    waitForAsync(() => {
      expect(component.result).toBe(true);
      expect(compiled.querySelector('#enforce-result')?.textContent).toBe('Allowed');
    })
  });
});
