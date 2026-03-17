export type WidgetId = 'planets' | 'aspects' | 'houses' | 'transits' | 'clock' | 'toolbar' | 'statistics';

export type HighlightFilter = {
    type: 'element' | 'modality' | 'polarity';
    value: string;
} | null;
