import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationConfigurationPage } from './notification-configuration.page';

describe('NotificationConfigurationPage', () => {
  let component: NotificationConfigurationPage;
  let fixture: ComponentFixture<NotificationConfigurationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationConfigurationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
