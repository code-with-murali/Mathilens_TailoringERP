using System.Text;
using System.Text.Json.Serialization;
using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Application;
using MathilensERP.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Every enum in this API's contracts (OrderStatus, InvoiceStatus, GarmentType, etc.)
        // is otherwise serialized as its underlying integer by System.Text.Json's default —
        // fragile for API consumers and undocumented in Swagger. Readable names, matching the
        // C# member names exactly, over the wire in both directions.
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// 00_MASTER_SPEC.md § 8.7 — every error response, including framework model-binding
// failures, uses the same envelope as Result-mapped failures.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var details = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .SelectMany(entry => entry.Value!.Errors.Select(e => new ApiFieldError(entry.Key, e.ErrorMessage)))
            .ToList();

        var body = ApiErrorResponse.From("VALIDATION_ERROR", "One or more fields are invalid.", details);
        return new BadRequestObjectResult(body);
    };
});

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Mathilens Tailoring ERP API", Version = "v1" });

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    var bearerScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a JWT access token issued by POST /api/v1/auth/login.",
    };

    options.AddSecurityDefinition("Bearer", bearerScheme);
    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", null, null)] = [],
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(jwtSection["SigningKey"]!)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorization();

// The Next.js frontend is a separately deployable application communicating over REST
// (01_ARCHITECTURE.md § 3 AD-007), so it calls the API cross-origin. The allowed origin is
// configuration-driven, not hardcoded, so it differs correctly per environment.
const string FrontendCorsPolicy = "Frontend";
var frontendOrigin = builder.Configuration["Cors:FrontendOrigin"];
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        if (!string.IsNullOrWhiteSpace(frontendOrigin))
        {
            policy.WithOrigins(frontendOrigin).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

/// <summary>Entry point, exposed for <c>WebApplicationFactory&lt;Program&gt;</c> in integration tests.</summary>
public partial class Program
{
}
