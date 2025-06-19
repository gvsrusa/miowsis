# MIOwSIS Deployment Guide

## Overview

This guide covers the deployment process for MIOwSIS across different environments using Docker and Kubernetes.

## Prerequisites

- Docker 20.10+
- Kubernetes 1.25+
- kubectl CLI
- GitHub account with container registry access
- Configured cloud provider (AWS/GCP/Azure)

## Environment Structure

```
Development → Staging → Production
```

## Quick Start

### Local Development

```bash
# Using Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3000

# View logs
docker-compose logs -f app
```

### Deploy to Kubernetes

```bash
# Deploy to staging
./scripts/deploy.sh staging v1.0.0

# Deploy to production
./scripts/deploy.sh production v1.0.0

# Rollback if needed
./scripts/rollback.sh production
```

## Environment Variables

Each environment has its own set of variables:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

Critical variables are stored in Kubernetes secrets.

## CI/CD Pipeline

### Automatic Deployments

- **Main branch** → Production
- **Staging branch** → Staging
- **Pull requests** → Preview deployments

### Manual Deployments

Trigger deployments via GitHub Actions:

1. Go to Actions → Deploy Pipeline
2. Click "Run workflow"
3. Select environment and version

## Monitoring

### Access Dashboards

- **Grafana**: https://grafana.miowsis.com
- **Prometheus**: https://prometheus.miowsis.com
- **Jaeger**: https://jaeger.miowsis.com

### Key Metrics

- Application uptime
- Request rate and latency
- Error rates
- Resource utilization

### Alerts

Alerts are configured for:
- Application downtime
- High error rates
- Resource exhaustion
- Security incidents

## Security

### Best Practices

1. **Secrets Management**
   - Use Kubernetes secrets
   - Rotate credentials regularly
   - Never commit secrets to git

2. **Network Security**
   - TLS encryption for all traffic
   - Network policies for pod communication
   - WAF rules on ingress

3. **Container Security**
   - Regular vulnerability scanning
   - Minimal base images
   - Non-root containers

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n miowsis-prod
   kubectl logs <pod-name> -n miowsis-prod
   ```

2. **Database connection issues**
   - Check Supabase status
   - Verify connection string
   - Check network policies

3. **High memory usage**
   - Check for memory leaks
   - Adjust resource limits
   - Scale horizontally

### Debug Commands

```bash
# Get pod status
kubectl get pods -n miowsis-prod

# View logs
kubectl logs -f deployment/prod-miowsis-app -n miowsis-prod

# Execute into pod
kubectl exec -it <pod-name> -n miowsis-prod -- /bin/sh

# Check events
kubectl get events -n miowsis-prod --sort-by='.lastTimestamp'
```

## Scaling

### Horizontal Scaling

Automatic scaling based on:
- CPU utilization (70%)
- Memory utilization (80%)
- Request rate (100 req/s)

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment/prod-miowsis-app --replicas=10 -n miowsis-prod

# Update HPA limits
kubectl edit hpa miowsis-hpa -n miowsis-prod
```

## Backup and Recovery

### Database Backups

- Automated daily backups via Supabase
- Point-in-time recovery available
- Test restore procedures monthly

### Application State

- Stateless application design
- Session data in Redis
- User uploads in object storage

## Maintenance

### Scheduled Maintenance

1. Enable maintenance mode
2. Scale down to single replica
3. Perform updates
4. Run health checks
5. Scale back up
6. Disable maintenance mode

### Zero-Downtime Deployments

- Rolling updates with surge capacity
- Health checks before traffic routing
- Automatic rollback on failures

## Cost Optimization

- Use spot instances for non-critical workloads
- Implement pod autoscaling
- Regular resource right-sizing
- Archive old logs to cold storage

## Contacts

- **DevOps Team**: devops@miowsis.com
- **On-Call**: +1-xxx-xxx-xxxx
- **Escalation**: tech-lead@miowsis.com

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Monitoring Runbooks](./monitoring/runbooks/)
- [Security Policies](./security/)