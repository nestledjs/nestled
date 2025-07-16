// Shared story option sets for Storybook stories

export interface Option {
  label: string;
  value: string;
}

export const countries: Option[] = [
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'United Kingdom', value: 'UK' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Japan', value: 'JP' },
  { label: 'Australia', value: 'AU' },
  { label: 'Brazil', value: 'BR' },
  { label: 'India', value: 'IN' },
  { label: 'China', value: 'CN' },
  { label: 'South Korea', value: 'KR' },
  { label: 'Italy', value: 'IT' },
  { label: 'Spain', value: 'ES' },
  { label: 'Netherlands', value: 'NL' },
  { label: 'Sweden', value: 'SE' },
  { label: 'Norway', value: 'NO' },
  { label: 'Denmark', value: 'DK' },
  { label: 'Finland', value: 'FI' },
  { label: 'Switzerland', value: 'CH' },
  { label: 'Austria', value: 'AT' },
];

export const cities: Option[] = [
  { label: 'New York', value: 'nyc' },
  { label: 'Los Angeles', value: 'la' },
  { label: 'Chicago', value: 'chicago' },
  { label: 'Houston', value: 'houston' },
  { label: 'Phoenix', value: 'phoenix' },
  { label: 'Philadelphia', value: 'philadelphia' },
  { label: 'San Antonio', value: 'san-antonio' },
  { label: 'San Diego', value: 'san-diego' },
  { label: 'Dallas', value: 'dallas' },
  { label: 'San Jose', value: 'san-jose' },
  { label: 'Austin', value: 'austin' },
  { label: 'Jacksonville', value: 'jacksonville' },
];

export const technologies: Option[] = [
  { label: 'React', value: 'react' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Next.js', value: 'nextjs' },
  { label: 'Nuxt.js', value: 'nuxtjs' },
  { label: 'Gatsby', value: 'gatsby' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Node.js', value: 'nodejs' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C#', value: 'csharp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
];

export const companies: Option[] = [
  { label: 'Apple Inc.', value: 'apple' },
  { label: 'Microsoft Corporation', value: 'microsoft' },
  { label: 'Alphabet Inc. (Google)', value: 'google' },
  { label: 'Amazon.com Inc.', value: 'amazon' },
  { label: 'Meta Platforms Inc. (Facebook)', value: 'meta' },
  { label: 'Tesla Inc.', value: 'tesla' },
  { label: 'NVIDIA Corporation', value: 'nvidia' },
  { label: 'Netflix Inc.', value: 'netflix' },
  { label: 'Adobe Inc.', value: 'adobe' },
  { label: 'Salesforce Inc.', value: 'salesforce' },
  { label: 'Oracle Corporation', value: 'oracle' },
  { label: 'Intel Corporation', value: 'intel' },
];

export const skills: Option[] = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'React', value: 'react' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Node.js', value: 'nodejs' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C#', value: 'csharp' },
  { label: 'PHP', value: 'php' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Ruby', value: 'ruby' },
];

export const colors: Option[] = [
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Purple', value: 'purple' },
  { label: 'Orange', value: 'orange' },
  { label: 'Pink', value: 'pink' },
  { label: 'Brown', value: 'brown' },
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
  { label: 'Gray', value: 'gray' },
  { label: 'Cyan', value: 'cyan' },
];

export const features: Option[] = [
  { label: 'Dark Mode', value: 'dark-mode' },
  { label: 'Push Notifications', value: 'push-notifications' },
  { label: 'Offline Support', value: 'offline-support' },
  { label: 'Real-time Updates', value: 'real-time-updates' },
  { label: 'Data Export', value: 'data-export' },
  { label: 'Advanced Search', value: 'advanced-search' },
  { label: 'Custom Themes', value: 'custom-themes' },
  { label: 'API Access', value: 'api-access' },
  { label: 'Two-Factor Auth', value: 'two-factor-auth' },
  { label: 'Single Sign-On', value: 'sso' },
];

export const interests: Option[] = [
  { label: 'Sports', value: 'sports' },
  { label: 'Music', value: 'music' },
  { label: 'Movies', value: 'movies' },
  { label: 'Books', value: 'books' },
  { label: 'Travel', value: 'travel' },
  { label: 'Cooking', value: 'cooking' },
  { label: 'Photography', value: 'photography' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Art', value: 'art' },
  { label: 'Technology', value: 'technology' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Fashion', value: 'fashion' },
];

export const priorities: Option[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

export const sizes: Option[] = [
  { label: 'Extra Small', value: 'xs' },
  { label: 'Small', value: 's' },
  { label: 'Medium', value: 'm' },
  { label: 'Large', value: 'l' },
  { label: 'Extra Large', value: 'xl' },
];

export const basicOptions: Option[] = [
  { label: 'Option One', value: 'option-1' },
  { label: 'Option Two', value: 'option-2' },
  { label: 'Option Three', value: 'option-3' },
  { label: 'Option Four', value: 'option-4' },
  { label: 'Option Five', value: 'option-5' },
];

export const basicSearchOptions: Option[] = [
  { label: 'Option Alpha', value: 'alpha' },
  { label: 'Option Beta', value: 'beta' },
  { label: 'Option Gamma', value: 'gamma' },
  { label: 'Option Delta', value: 'delta' },
  { label: 'Option Epsilon', value: 'epsilon' },
];

export const basicSelectOptions: Option[] = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
]; 